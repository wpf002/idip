"""Full scan pipeline orchestrator.

Runs the 12-step pipeline: detect input -> parse -> load rules -> verify age ->
check expiration -> validate format -> detect fraud -> score risk -> map to
ALLOW/REVIEW/DENY -> (challenge) -> (webhook) -> audit log.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import hmac_hash
from . import location_rules
from .age_verifier import is_expired, verify_age
from .barcode_parser import looks_like_pdf417, parse_barcode
from .document_validator import validate_document
from .face_challenge import challenge_available, score_challenge
from .fraud_detector import detect_fraud
from .mrz_parser import RECOGNIZED_COUNTRIES, looks_like_mrz, parse_mrz
from .parsed_id import ParsedID
from .risk_scorer import flag, score_risk
from .state_rules_engine import validate as validate_rules
from .violations import (
    EXPIRED,
    FUTURE_DOB,
    MANUAL_ENTRY,
    MRZ_CHECK_DIGIT_FAILURE,
    PARSE_ERROR,
    UNDERAGE,
    UNRECOGNIZED_COUNTRY,
    Violation,
)


@dataclass
class DecisionResult:
    parsed: ParsedID
    risk_score: int
    result: str
    flags: list[dict]
    age: int | None
    is_valid_age: bool
    is_expired: bool
    hashed_license_number: str | None
    state: str | None
    challenge_available: bool
    challenge_required: bool
    violations: list[Violation] = field(default_factory=list)


def detect_and_parse(raw_data: str, document_input_type: str = "AUTO") -> ParsedID:
    dt = (document_input_type or "AUTO").upper()
    if dt == "PDF417":
        return parse_barcode(raw_data)
    if dt == "MRZ":
        return parse_mrz(raw_data)
    # AUTO
    if looks_like_pdf417(raw_data):
        return parse_barcode(raw_data)
    if looks_like_mrz(raw_data):
        return parse_mrz(raw_data)
    # Default attempt: barcode then mrz
    parsed = parse_barcode(raw_data)
    if parsed.has_errors and not parsed.license_number:
        return parse_mrz(raw_data)
    return parsed


def assemble_violations(
    parsed: ParsedID,
    rules: dict,
    *,
    scan_method: str,
    challenge_failures: int | None,
    fraud_violations: list[Violation],
    today: date | None = None,
    minimum_age: int | None = None,
) -> tuple[list[Violation], dict]:
    violations: list[Violation] = []

    # Parse errors
    if parsed.has_errors:
        violations.append(flag(PARSE_ERROR, message="; ".join(parsed.parse_errors)))

    # Age
    age_res = verify_age(parsed.date_of_birth, minimum_age=minimum_age, today=today)
    if age_res.is_future_dob:
        violations.append(flag(FUTURE_DOB, message="date of birth is in the future"))
    elif age_res.is_underage:
        violations.append(flag(UNDERAGE, message=f"under minimum age (age {age_res.age})"))

    # Expiration (weight is state-specific: TX/TABC = 50, others = 40)
    expired = is_expired(parsed.expiration_date, today=today)
    if expired:
        violations.append(
            Violation(EXPIRED, "document is expired", location_rules.expired_weight(rules))
        )

    # MRZ check digits
    if parsed.mrz_check_digits_valid is False:
        violations.append(flag(MRZ_CHECK_DIGIT_FAILURE, message="MRZ check digit failure"))

    # Unrecognized issuing country (MRZ documents only)
    if parsed.source == "MRZ" and parsed.issuing_country:
        if parsed.issuing_country.upper() not in RECOGNIZED_COUNTRIES:
            violations.append(
                flag(UNRECOGNIZED_COUNTRY, message=f"unrecognized country {parsed.issuing_country}")
            )

    # Manual entry penalty
    if scan_method == "manual":
        violations.append(flag(MANUAL_ENTRY, message="manual entry fallback used"))

    # State-rule (AAMVA) validation applies only to PDF417 documents; MRZ
    # documents are validated via check digits and country recognition.
    if parsed.source == "PDF417":
        violations.extend(validate_rules(parsed, rules))
    violations.extend(validate_document(parsed))

    # Fraud
    violations.extend(fraud_violations)

    # Challenge outcome
    if challenge_failures is not None:
        violations.append(score_challenge(challenge_failures))

    meta = {
        "age": age_res.age,
        "is_valid_age": age_res.is_valid_age,
        "is_expired": expired,
    }
    return violations, meta


async def run_pipeline(
    session: AsyncSession,
    *,
    raw_data: str = "",
    document_input_type: str = "AUTO",
    parsed: ParsedID | None = None,
    extra_violations: list[Violation] | None = None,
    location_id: str | None = None,
    location_state: str | None = None,
    scan_method: str = "camera",
    challenge_failures: int | None = None,
    today: date | None = None,
    minimum_age: int | None = None,
    run_fraud: bool = True,
) -> DecisionResult:
    # `parsed` may be supplied directly (e.g. fields extracted on-device by an
    # ID-scanning SDK); otherwise parse the raw barcode/MRZ string.
    if parsed is None:
        parsed = detect_and_parse(raw_data, document_input_type)
    rules = location_rules.rules_for_document(parsed, location_state=location_state)

    hashed = hmac_hash(parsed.license_number) if parsed.license_number else None

    fraud_violations: list[Violation] = []
    if run_fraud and hashed:
        fraud_violations = await detect_fraud(
            session,
            hashed_license_number=hashed,
            location_id=location_id,
            duplicate_weight=location_rules.duplicate_weight(rules),
        )

    violations, meta = assemble_violations(
        parsed,
        rules,
        scan_method=scan_method,
        challenge_failures=challenge_failures,
        fraud_violations=fraud_violations,
        today=today,
        minimum_age=minimum_age,
    )
    if extra_violations:
        violations.extend(extra_violations)

    risk = score_risk(violations, thresholds=location_rules.thresholds(rules))

    return DecisionResult(
        parsed=parsed,
        risk_score=risk.score,
        result=risk.result,
        flags=risk.flags,
        age=meta["age"],
        is_valid_age=meta["is_valid_age"],
        is_expired=meta["is_expired"],
        hashed_license_number=hashed,
        state=parsed.state,
        challenge_available=challenge_available(parsed),
        challenge_required=bool(rules.get("challenge_required", False)),
        violations=violations,
    )
