"""Violation value object and standard codes shared across services."""
from __future__ import annotations

from dataclasses import dataclass

# Standard violation / flag codes
UNDERAGE = "UNDERAGE"
FUTURE_DOB = "FUTURE_DOB"
EXPIRED = "EXPIRED"
INVALID_FORMAT = "INVALID_FORMAT"
REGEX_MISMATCH = "REGEX_MISMATCH"
MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD"
STATE_MISMATCH = "STATE_MISMATCH"
DUPLICATE_SCAN = "DUPLICATE_SCAN"
REPEAT_OFFENDER = "REPEAT_OFFENDER"
MANUAL_ENTRY = "MANUAL_ENTRY"
UNRECOGNIZED_COUNTRY = "UNRECOGNIZED_COUNTRY"
DATA_MISMATCH = "DATA_MISMATCH"  # front (visual) vs barcode/MRZ disagree — tamper
MRZ_CHECK_DIGIT_FAILURE = "MRZ_CHECK_DIGIT_FAILURE"
PARSE_ERROR = "PARSE_ERROR"
CHALLENGE_FAIL_1 = "CHALLENGE_FAIL_1"
CHALLENGE_FAIL_2 = "CHALLENGE_FAIL_2"
CHALLENGE_FAIL_3 = "CHALLENGE_FAIL_3"
CHALLENGE_PASSED = "CHALLENGE_PASSED"


@dataclass
class Violation:
    code: str
    message: str
    weight: int

    def as_dict(self) -> dict:
        return {"code": self.code, "message": self.message, "weight": self.weight}
