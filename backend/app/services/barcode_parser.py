"""AAMVA PDF417 barcode parser.

Parses the AAMVA DL/ID card design standard (compliance indicator ``@``,
``ANSI`` header, subfile directory, and LF-delimited 3-character data
elements) into a :class:`ParsedID`.
"""
from __future__ import annotations

from datetime import date

from .parsed_id import (
    ParsedID,
    US_DRIVERS_LICENSE,
    US_STATE_ID,
    UNKNOWN,
)

# AAMVA element id -> ParsedID attribute
AAMVA_FIELD_MAP: dict[str, str] = {
    "DCS": "last_name",
    "DAC": "first_name",
    "DAD": "middle_name",
    "DBB": "date_of_birth",
    "DBA": "expiration_date",
    "DBD": "issue_date",
    "DBC": "sex",
    "DAQ": "license_number",
    "DAG": "address_street",
    "DAI": "address_city",
    "DAJ": "address_state",
    "DAK": "postal_code",
    "DAU": "height",
    "DAY": "eye_color",
    "DAZ": "hair_color",
}

DATE_FIELDS = {"date_of_birth", "expiration_date", "issue_date"}
SEX_MAP = {"1": "M", "2": "F", "9": "X", "M": "M", "F": "F"}


def _parse_aamva_date(raw: str) -> str | None:
    """AAMVA dates are 8 digits. US jurisdictions use MMDDCCYY; the older
    ISO ordering CCYYMMDD is detected by inspecting the first two digits."""
    raw = (raw or "").strip()
    if len(raw) != 8 or not raw.isdigit():
        return None
    a, b, c = raw[0:2], raw[2:4], raw[4:8]
    # MMDDCCYY when the leading pair is a valid month.
    if 1 <= int(a) <= 12:
        month, day, year = int(a), int(b), int(c)
    else:  # CCYYMMDD fallback
        year, month, day = int(raw[0:4]), int(raw[4:6]), int(raw[6:8])
    try:
        return date(year, month, day).isoformat()
    except ValueError:
        return None


def looks_like_pdf417(data: str) -> bool:
    if not data:
        return False
    return "ANSI " in data[:64] or data.lstrip().startswith("@")


def parse_barcode(data: str) -> ParsedID:
    result = ParsedID(source="PDF417")
    if not data:
        result.parse_errors.append("empty barcode payload")
        return result

    header_idx = data.find("ANSI ")
    if header_idx == -1:
        header_idx = data.find("AAMVA")
    if header_idx == -1:
        result.parse_errors.append("missing AAMVA header")
        return result

    try:
        pos = header_idx + (5 if data[header_idx:header_idx + 5] == "ANSI " else 6)
        # iin(6) version(2) jurisdiction(2) entries(2)
        version = data[pos + 6:pos + 8]
        num_entries = int(data[pos + 10:pos + 12])
        result.raw_fields["aamva_version"] = version
        dir_start = pos + 12
        subfile_type = data[dir_start:dir_start + 2]
        offset = int(data[dir_start + 2:dir_start + 6])
        length = int(data[dir_start + 6:dir_start + 10])
        result.raw_fields["num_entries"] = num_entries
        segment = data[offset:offset + length]
    except (ValueError, IndexError):
        result.parse_errors.append("malformed AAMVA header/directory")
        return result

    # Strip the leading 2-char subfile type from the segment.
    if segment[:2] in ("DL", "ID"):
        subfile_type = segment[:2]
        segment = segment[2:]
    result.document_type = (
        US_DRIVERS_LICENSE if subfile_type == "DL"
        else US_STATE_ID if subfile_type == "ID"
        else UNKNOWN
    )

    for line in segment.replace("\r", "\n").split("\n"):
        line = line.strip()
        if len(line) < 3:
            continue
        code, value = line[:3], line[3:].strip()
        attr = AAMVA_FIELD_MAP.get(code)
        if not attr or not value:
            if code not in AAMVA_FIELD_MAP:
                result.raw_fields.setdefault("unmapped", {})[code] = value
            continue
        if attr in DATE_FIELDS:
            parsed = _parse_aamva_date(value)
            if parsed is None:
                result.parse_errors.append(f"unparseable date in {code}")
            setattr(result, attr, parsed)
        elif attr == "sex":
            result.sex = SEX_MAP.get(value.upper(), value)
        else:
            setattr(result, attr, value)

    if result.address_state and not result.state:
        result.state = result.address_state.upper()
    elif result.address_state:
        result.state = result.address_state.upper()
    result.state = (result.state or "").upper() or None

    if not result.license_number:
        result.parse_errors.append("missing license number (DAQ)")

    return result
