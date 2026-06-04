"""Risk scoring: sum weighted violations into a 0-100 score and a decision."""
from __future__ import annotations

from dataclasses import dataclass

from .violations import (
    CHALLENGE_FAIL_1,
    CHALLENGE_FAIL_2,
    CHALLENGE_FAIL_3,
    CHALLENGE_PASSED,
    DUPLICATE_SCAN,
    EXPIRED,
    FUTURE_DOB,
    INVALID_FORMAT,
    MANUAL_ENTRY,
    MISSING_REQUIRED_FIELD,
    MRZ_CHECK_DIGIT_FAILURE,
    PARSE_ERROR,
    REGEX_MISMATCH,
    REPEAT_OFFENDER,
    STATE_MISMATCH,
    UNDERAGE,
    UNRECOGNIZED_COUNTRY,
    Violation,
)

ALLOW = "ALLOW"
REVIEW = "REVIEW"
DENY = "DENY"

# Canonical risk weights (per the IDIP scoring spec).
RISK_WEIGHTS: dict[str, int] = {
    UNDERAGE: 100,
    FUTURE_DOB: 50,
    EXPIRED: 40,  # default; TX (TABC) overrides to 50 via state rules
    CHALLENGE_FAIL_3: 60,
    MRZ_CHECK_DIGIT_FAILURE: 35,
    CHALLENGE_FAIL_2: 35,
    REPEAT_OFFENDER: 30,
    REGEX_MISMATCH: 25,
    INVALID_FORMAT: 25,
    MISSING_REQUIRED_FIELD: 25,
    DUPLICATE_SCAN: 20,
    STATE_MISMATCH: 20,
    MANUAL_ENTRY: 15,
    CHALLENGE_FAIL_1: 15,
    UNRECOGNIZED_COUNTRY: 15,
    PARSE_ERROR: 10,
    CHALLENGE_PASSED: -10,
}

DEFAULT_THRESHOLDS = {"allow_max": 30, "review_max": 70, "deny_min": 71}


@dataclass
class RiskResult:
    score: int
    result: str
    flags: list[dict]


def flag(code: str, *, weight: int | None = None, message: str | None = None) -> Violation:
    """Build a Violation, defaulting the weight from the canonical table."""
    w = RISK_WEIGHTS.get(code, 0) if weight is None else weight
    return Violation(code=code, message=message or code, weight=w)


def map_result(score: int, thresholds: dict | None = None) -> str:
    t = {**DEFAULT_THRESHOLDS, **(thresholds or {})}
    if score <= t["allow_max"]:
        return ALLOW
    if score <= t["review_max"]:
        return REVIEW
    return DENY


def score_risk(
    violations: list[Violation], *, thresholds: dict | None = None
) -> RiskResult:
    raw = sum(v.weight for v in violations)
    score = max(0, min(100, raw))
    result = map_result(score, thresholds)
    return RiskResult(
        score=score,
        result=result,
        flags=[v.as_dict() for v in violations],
    )
