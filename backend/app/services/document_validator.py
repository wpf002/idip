"""Cross-field consistency checks independent of state rules."""
from __future__ import annotations

from datetime import date

from .parsed_id import ParsedID
from .violations import INVALID_FORMAT, Violation


def _iso(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def validate_document(parsed: ParsedID) -> list[Violation]:
    """Internal-consistency checks: dob<expiration, issue<expiration, etc."""
    violations: list[Violation] = []

    dob = _iso(parsed.date_of_birth)
    exp = _iso(parsed.expiration_date)
    iss = _iso(parsed.issue_date)

    if dob and exp and dob >= exp:
        violations.append(
            Violation(INVALID_FORMAT, "date of birth is on/after expiration", 25)
        )
    if iss and exp and iss > exp:
        violations.append(
            Violation(INVALID_FORMAT, "issue date is after expiration", 25)
        )
    if dob and iss and dob > iss:
        violations.append(
            Violation(INVALID_FORMAT, "date of birth is after issue date", 25)
        )

    return violations
