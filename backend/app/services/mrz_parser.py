"""ICAO 9303 Machine Readable Zone parser (TD1 and TD3).

Supports TD3 (passport / passport book, 2x44) and TD1 (ID card / passport
card, 3x30). Validates check digits and maps to a :class:`ParsedID`.
"""
from __future__ import annotations

from datetime import date

from .parsed_id import (
    ParsedID,
    INTERNATIONAL_ID,
    INTERNATIONAL_PASSPORT,
    PASSPORT_CARD,
    US_PASSPORT,
    MILITARY_ID,
    UNKNOWN,
)

# A small set of recognized ISO-3166-1 alpha-3 codes. Anything outside this
# set raises the "unrecognized issuing country" flag downstream.
RECOGNIZED_COUNTRIES = {
    "USA", "CAN", "MEX", "GBR", "FRA", "DEU", "ESP", "ITA", "NLD", "BEL",
    "CHE", "AUT", "SWE", "NOR", "DNK", "FIN", "IRL", "PRT", "POL", "GRC",
    "AUS", "NZL", "JPN", "KOR", "CHN", "IND", "BRA", "ARG", "ZAF", "ISR",
    "UTO",  # ICAO specimen / "Utopia"
}


def _char_value(ch: str) -> int:
    if ch == "<":
        return 0
    if ch.isdigit():
        return int(ch)
    if "A" <= ch <= "Z":
        return ord(ch) - 55  # A=10 ... Z=35
    return 0


def compute_check_digit(data: str) -> str:
    weights = [7, 3, 1]
    total = sum(_char_value(c) * weights[i % 3] for i, c in enumerate(data))
    return str(total % 10)


def _mrz_date(yymmdd: str, *, is_expiry: bool) -> str | None:
    if len(yymmdd) != 6 or not yymmdd.isdigit():
        return None
    yy, mm, dd = int(yymmdd[0:2]), int(yymmdd[2:4]), int(yymmdd[4:6])
    if is_expiry:
        year = 2000 + yy
    else:
        # DOB: pivot — two-digit years above the current year are last century.
        year = 2000 + yy if (2000 + yy) <= date.today().year else 1900 + yy
    try:
        return date(year, mm, dd).isoformat()
    except ValueError:
        return None


def _clean(field: str) -> str:
    return field.replace("<", " ").strip()


def looks_like_mrz(data: str) -> bool:
    if not data:
        return False
    lines = [ln for ln in data.strip().splitlines() if ln.strip()]
    if len(lines) < 2:
        return False
    lengths = {len(ln.strip()) for ln in lines}
    return lengths <= {44} or lengths <= {30} or "<<" in data


def _parse_names(name_field: str) -> tuple[str | None, str | None, str | None]:
    primary, _, secondary = name_field.partition("<<")
    last = _clean(primary) or None
    given_parts = [p for p in secondary.split("<") if p]
    first = given_parts[0] if given_parts else None
    middle = " ".join(given_parts[1:]) if len(given_parts) > 1 else None
    return first, middle, last


def _doc_type(doc_code: str, issuer: str, line_count: int) -> str:
    code = doc_code.replace("<", "").upper()
    if line_count == 2:  # TD3
        if issuer == "USA":
            return US_PASSPORT
        return INTERNATIONAL_PASSPORT
    # TD1 (3 lines)
    if code.startswith("P"):
        return PASSPORT_CARD
    if "ML" in code or "C" == code:
        return MILITARY_ID
    return INTERNATIONAL_ID


def _parse_td3(lines: list[str], result: ParsedID) -> ParsedID:
    l1, l2 = lines[0].ljust(44, "<"), lines[1].ljust(44, "<")
    issuer = l1[2:5].replace("<", "")
    first, middle, last = _parse_names(l1[5:])
    result.first_name, result.middle_name, result.last_name = first, middle, last

    passport_no = l2[0:9]
    passport_no_cd = l2[9]
    nationality = l2[10:13].replace("<", "")
    dob_raw = l2[13:19]
    dob_cd = l2[19]
    result.sex = {"M": "M", "F": "F"}.get(l2[20], "X")
    expiry_raw = l2[21:27]
    expiry_cd = l2[27]

    result.license_number = _clean(passport_no) or None
    result.nationality = nationality or None
    result.issuing_country = issuer or None
    result.date_of_birth = _mrz_date(dob_raw, is_expiry=False)
    result.expiration_date = _mrz_date(expiry_raw, is_expiry=True)
    result.state = None

    checks_ok = (
        compute_check_digit(passport_no) == passport_no_cd
        and compute_check_digit(dob_raw) == dob_cd
        and compute_check_digit(expiry_raw) == expiry_cd
    )
    result.mrz_check_digits_valid = checks_ok
    if not checks_ok:
        result.parse_errors.append("MRZ check digit failure")

    result.document_type = _doc_type("P", issuer, 2)
    return result


def _parse_td1(lines: list[str], result: ParsedID) -> ParsedID:
    l1 = lines[0].ljust(30, "<")
    l2 = lines[1].ljust(30, "<")
    l3 = lines[2].ljust(30, "<")
    doc_code = l1[0:2]
    issuer = l1[2:5].replace("<", "")
    doc_no = l1[5:14]
    doc_no_cd = l1[14]

    dob_raw = l2[0:6]
    dob_cd = l2[6]
    result.sex = {"M": "M", "F": "F"}.get(l2[7], "X")
    expiry_raw = l2[8:14]
    expiry_cd = l2[14]
    nationality = l2[15:18].replace("<", "")

    first, middle, last = _parse_names(l3)
    result.first_name, result.middle_name, result.last_name = first, middle, last

    result.license_number = _clean(doc_no) or None
    result.nationality = nationality or None
    result.issuing_country = issuer or None
    result.date_of_birth = _mrz_date(dob_raw, is_expiry=False)
    result.expiration_date = _mrz_date(expiry_raw, is_expiry=True)

    checks_ok = (
        compute_check_digit(doc_no) == doc_no_cd
        and compute_check_digit(dob_raw) == dob_cd
        and compute_check_digit(expiry_raw) == expiry_cd
    )
    result.mrz_check_digits_valid = checks_ok
    if not checks_ok:
        result.parse_errors.append("MRZ check digit failure")

    result.document_type = _doc_type(doc_code, issuer, 3)
    return result


def parse_mrz(data: str) -> ParsedID:
    result = ParsedID(source="MRZ")
    if not data:
        result.parse_errors.append("empty MRZ payload")
        return result

    lines = [ln.strip().upper() for ln in data.strip().splitlines() if ln.strip()]
    try:
        if len(lines) == 2 and all(len(ln) >= 30 for ln in lines):
            return _parse_td3(lines, result)
        if len(lines) == 3:
            return _parse_td1(lines, result)
        result.parse_errors.append("unrecognized MRZ format")
        result.document_type = UNKNOWN
        return result
    except (ValueError, IndexError):
        result.parse_errors.append("malformed MRZ")
        result.document_type = UNKNOWN
        return result
