"""Unit tests for the ICAO 9303 MRZ parser."""
from app.services.mrz_parser import (
    compute_check_digit,
    looks_like_mrz,
    parse_mrz,
)
from app.services.parsed_id import (
    INTERNATIONAL_ID,
    INTERNATIONAL_PASSPORT,
    US_PASSPORT,
)

from tests.factories import build_td1, build_td3


def test_check_digit_known_value():
    # ICAO 9303 worked example.
    assert compute_check_digit("520727") == "3"


def test_check_digit_all_fillers_is_zero():
    assert compute_check_digit("<<<<<<") == "0"


def test_td3_parses_us_passport():
    p = parse_mrz(build_td3(issuer="USA"))
    assert p.document_type == US_PASSPORT


def test_td3_parses_international_passport():
    p = parse_mrz(build_td3(issuer="GBR", nationality="GBR"))
    assert p.document_type == INTERNATIONAL_PASSPORT


def test_td3_parses_passport_number():
    p = parse_mrz(build_td3(passport_no="987654321"))
    assert p.license_number == "987654321"


def test_td3_parses_names():
    p = parse_mrz(build_td3(last="MARTIN", first="ALICE"))
    assert p.last_name == "MARTIN"
    assert p.first_name == "ALICE"


def test_td3_parses_dob_iso():
    p = parse_mrz(build_td3(dob="900115"))
    assert p.date_of_birth == "1990-01-15"


def test_td3_parses_expiry_iso():
    p = parse_mrz(build_td3(expiry="350630"))
    assert p.expiration_date == "2035-06-30"


def test_td3_valid_check_digits():
    p = parse_mrz(build_td3())
    assert p.mrz_check_digits_valid is True
    assert not p.has_errors


def test_td3_invalid_check_digit_flags_error():
    p = parse_mrz(build_td3(corrupt_check=True))
    assert p.mrz_check_digits_valid is False
    assert any("check digit" in e.lower() for e in p.parse_errors)


def test_td3_nationality_and_issuer():
    p = parse_mrz(build_td3(issuer="USA", nationality="USA"))
    assert p.nationality == "USA"
    assert p.issuing_country == "USA"


def test_td1_parses_international_id():
    p = parse_mrz(build_td1(doc_code="ID", issuer="DEU", nationality="DEU"))
    assert p.document_type == INTERNATIONAL_ID
    assert p.issuing_country == "DEU"


def test_td1_parses_document_number():
    p = parse_mrz(build_td1(doc_no="AB1234567"))
    assert p.license_number == "AB1234567"


def test_looks_like_mrz_and_unrecognized_format():
    assert looks_like_mrz(build_td3())
    bad = parse_mrz("just one line of text")
    assert bad.has_errors
