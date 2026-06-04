"""JSON-driven per-state validation engine."""
from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path

from ..config import settings
from .barcode_parser import AAMVA_FIELD_MAP
from .parsed_id import ParsedID
from .violations import (
    MISSING_REQUIRED_FIELD,
    REGEX_MISMATCH,
    STATE_MISMATCH,
    Violation,
)

DEFAULT_FRAUD_WEIGHTS = {
    "missing_required_field_weight": 25,
    "regex_mismatch_weight": 25,
    "expired_weight": 40,
    "duplicate_scan_weight": 20,
    "state_mismatch_weight": 20,
}

DEFAULT_THRESHOLDS = {"allow_max": 30, "review_max": 70, "deny_min": 71}


@lru_cache(maxsize=128)
def _load_file(state_code: str) -> dict | None:
    path: Path = settings.state_rules_dir / f"{state_code}.json"
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text())
    except (json.JSONDecodeError, OSError):
        return None


def load_rules(state_code: str | None) -> dict:
    """Load the rule set for a state, falling back to DEFAULT."""
    code = (state_code or "").upper()
    rules = _load_file(code) if code else None
    if rules is None:
        rules = _load_file("DEFAULT") or {}
    return rules


def fraud_weights(rules: dict) -> dict:
    weights = dict(DEFAULT_FRAUD_WEIGHTS)
    weights.update(rules.get("fraud_indicators", {}) or {})
    return weights


def thresholds(rules: dict) -> dict:
    t = dict(DEFAULT_THRESHOLDS)
    t.update(rules.get("result_thresholds", {}) or {})
    return t


def validate(parsed: ParsedID, rules: dict) -> list[Violation]:
    """Validate a parsed ID against a state rule set. Returns violations."""
    violations: list[Violation] = []
    weights = fraud_weights(rules)

    # License number regex
    ln_rules = rules.get("license_number", {}) or {}
    regex = ln_rules.get("regex")
    if regex and parsed.license_number is not None:
        if not re.match(regex, parsed.license_number):
            violations.append(
                Violation(
                    REGEX_MISMATCH,
                    f"license number '{parsed.license_number}' fails {rules.get('state_code', '')} pattern",
                    int(weights["regex_mismatch_weight"]),
                )
            )

    # Required fields (AAMVA element codes -> ParsedID attrs)
    for code in rules.get("required_fields", []) or []:
        attr = AAMVA_FIELD_MAP.get(code)
        if attr is None:
            continue
        if not getattr(parsed, attr, None):
            violations.append(
                Violation(
                    MISSING_REQUIRED_FIELD,
                    f"missing required field {code}",
                    int(weights["missing_required_field_weight"]),
                )
            )

    # Postal code format
    addr_rules = rules.get("address_rules", {}) or {}
    postal_regex = addr_rules.get("postal_code_regex")
    if postal_regex and parsed.postal_code:
        if not re.match(postal_regex, parsed.postal_code):
            violations.append(
                Violation(
                    REGEX_MISMATCH,
                    f"postal code '{parsed.postal_code}' invalid format",
                    int(weights["regex_mismatch_weight"]),
                )
            )

    # Jurisdiction match
    if addr_rules.get("state_must_match_jurisdiction"):
        expected = (rules.get("state_code") or "").upper()
        actual = (parsed.address_state or parsed.state or "").upper()
        if expected and actual and expected != actual:
            violations.append(
                Violation(
                    STATE_MISMATCH,
                    f"address state {actual} != jurisdiction {expected}",
                    int(weights["state_mismatch_weight"]),
                )
            )

    return violations
