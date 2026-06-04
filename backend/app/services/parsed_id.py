"""Shared parsed-identity data structure produced by both parsers."""
from __future__ import annotations

from dataclasses import dataclass, field


# Document type constants
US_DRIVERS_LICENSE = "US_DRIVERS_LICENSE"
US_STATE_ID = "US_STATE_ID"
US_PASSPORT = "US_PASSPORT"
PASSPORT_CARD = "PASSPORT_CARD"
INTERNATIONAL_PASSPORT = "INTERNATIONAL_PASSPORT"
INTERNATIONAL_ID = "INTERNATIONAL_ID"
MILITARY_ID = "MILITARY_ID"
UNKNOWN = "UNKNOWN"


@dataclass
class ParsedID:
    document_type: str = UNKNOWN

    # Names
    first_name: str | None = None
    middle_name: str | None = None
    last_name: str | None = None

    # Dates (ISO YYYY-MM-DD strings)
    date_of_birth: str | None = None
    expiration_date: str | None = None
    issue_date: str | None = None

    # Demographics
    sex: str | None = None
    height: str | None = None
    eye_color: str | None = None
    hair_color: str | None = None

    # Identifiers
    license_number: str | None = None

    # Address
    address_street: str | None = None
    address_city: str | None = None
    address_state: str | None = None
    postal_code: str | None = None

    # Jurisdiction / nationality
    state: str | None = None  # 2-letter issuing jurisdiction (US)
    nationality: str | None = None  # ISO-3 (MRZ)
    issuing_country: str | None = None  # ISO-3 (MRZ)

    # MRZ-specific
    mrz_check_digits_valid: bool | None = None

    # Provenance
    source: str | None = None  # "PDF417" | "MRZ"
    parse_errors: list[str] = field(default_factory=list)
    raw_fields: dict = field(default_factory=dict)

    @property
    def full_name(self) -> str:
        parts = [self.first_name, self.middle_name, self.last_name]
        return " ".join(p for p in parts if p).strip()

    @property
    def has_errors(self) -> bool:
        return bool(self.parse_errors)
