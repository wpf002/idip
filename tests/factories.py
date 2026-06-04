"""Builders for synthetic AAMVA PDF417 and ICAO MRZ payloads.

These mirror the structure the parsers expect so fixtures stay consistent with
the production parsing code.
"""
from __future__ import annotations

from app.services.mrz_parser import compute_check_digit

AAMVA_PREFIX = "@\n\x1e\rANSI "


def build_aamva(
    fields: dict[str, str],
    *,
    subfile: str = "DL",
    iin: str = "636014",
    version: str = "08",
    jurisdiction: str = "00",
) -> str:
    """Build a spec-shaped AAMVA PDF417 string with a correct subfile directory."""
    segment = subfile + "".join(f"{k}{v}\n" for k, v in fields.items()) + "\r"
    length = len(segment)
    header_core = f"{iin}{version}{jurisdiction}01"  # 6+2+2+2 = 12 chars
    directory_len = 10  # subfile(2) + offset(4) + length(4)
    offset = len(AAMVA_PREFIX) + len(header_core) + directory_len
    directory = f"{subfile}{offset:04d}{length:04d}"
    return AAMVA_PREFIX + header_core + directory + segment


# Convenience field presets ---------------------------------------------------
def dl_fields(
    *,
    license_number: str = "12345678",
    last: str = "DOE",
    first: str = "JOHN",
    middle: str = "QUINCY",
    dob: str = "01151990",  # MMDDYYYY
    expiration: str = "01152035",
    sex: str = "1",
    street: str = "123 MAIN ST",
    city: str = "DALLAS",
    state: str = "TX",
    postal: str = "75001",
    height: str = "070 in",
    eye: str = "BRO",
) -> dict[str, str]:
    return {
        "DAQ": license_number,
        "DCS": last,
        "DAC": first,
        "DAD": middle,
        "DBB": dob,
        "DBA": expiration,
        "DBC": sex,
        "DAG": street,
        "DAI": city,
        "DAJ": state,
        "DAK": postal,
        "DAU": height,
        "DAY": eye,
    }


# ---- MRZ TD3 (passport, 2x44) ----
def build_td3(
    *,
    issuer: str = "USA",
    nationality: str = "USA",
    last: str = "DOE",
    first: str = "JOHN",
    passport_no: str = "123456789",
    dob: str = "900115",  # YYMMDD
    expiry: str = "350115",
    sex: str = "M",
    corrupt_check: bool = False,
) -> str:
    name_field = f"{last}<<{first}".ljust(39, "<")
    line1 = ("P<" + issuer + name_field)[:44].ljust(44, "<")

    pno = passport_no[:9].ljust(9, "<")
    pno_cd = compute_check_digit(pno)
    dob_cd = compute_check_digit(dob)
    exp_cd = compute_check_digit(expiry)
    personal = "<" * 14
    personal_cd = compute_check_digit(personal)
    if corrupt_check:
        # Flip the passport-number check digit to an incorrect value.
        pno_cd = str((int(pno_cd) + 1) % 10)
    composite = "0"
    line2 = (
        pno + pno_cd + nationality + dob + dob_cd + sex + expiry + exp_cd
        + personal + personal_cd + composite
    )
    line2 = line2[:44].ljust(44, "<")
    return f"{line1}\n{line2}"


# ---- MRZ TD1 (ID / passport card, 3x30) ----
def build_td1(
    *,
    doc_code: str = "ID",
    issuer: str = "USA",
    nationality: str = "USA",
    last: str = "DOE",
    first: str = "JOHN",
    doc_no: str = "AB1234567",
    dob: str = "900115",
    expiry: str = "350115",
    sex: str = "M",
) -> str:
    dno = doc_no[:9].ljust(9, "<")
    dno_cd = compute_check_digit(dno)
    line1 = (doc_code[:2].ljust(2, "<") + issuer + dno + dno_cd).ljust(30, "<")

    dob_cd = compute_check_digit(dob)
    exp_cd = compute_check_digit(expiry)
    line2 = (dob + dob_cd + sex + expiry + exp_cd + nationality).ljust(29, "<") + "0"
    line2 = line2[:30].ljust(30, "<")

    line3 = f"{last}<<{first}".ljust(30, "<")[:30]
    return f"{line1}\n{line2}\n{line3}"
