"""Unit tests for the AAMVA PDF417 barcode parser."""
from app.services.barcode_parser import (
    AAMVA_FIELD_MAP,
    looks_like_pdf417,
    parse_barcode,
)
from app.services.parsed_id import US_DRIVERS_LICENSE, US_STATE_ID

from tests.factories import build_aamva, dl_fields


def test_parses_drivers_license_document_type():
    p = parse_barcode(build_aamva(dl_fields()))
    assert p.document_type == US_DRIVERS_LICENSE


def test_parses_state_id_document_type():
    p = parse_barcode(build_aamva(dl_fields(), subfile="ID"))
    assert p.document_type == US_STATE_ID


def test_parses_license_number():
    p = parse_barcode(build_aamva(dl_fields(license_number="98765432")))
    assert p.license_number == "98765432"


def test_parses_names():
    p = parse_barcode(build_aamva(dl_fields(first="JANE", last="SMITH", middle="ANN")))
    assert p.first_name == "JANE"
    assert p.last_name == "SMITH"
    assert p.middle_name == "ANN"


def test_full_name_property():
    p = parse_barcode(build_aamva(dl_fields(first="JANE", last="SMITH", middle="ANN")))
    assert p.full_name == "JANE ANN SMITH"


def test_parses_dob_to_iso():
    p = parse_barcode(build_aamva(dl_fields(dob="01151990")))
    assert p.date_of_birth == "1990-01-15"


def test_parses_expiration_to_iso():
    p = parse_barcode(build_aamva(dl_fields(expiration="12312030")))
    assert p.expiration_date == "2030-12-31"


def test_parses_state_and_address():
    p = parse_barcode(build_aamva(dl_fields(state="GA", city="ATLANTA", postal="30301")))
    assert p.state == "GA"
    assert p.address_city == "ATLANTA"
    assert p.postal_code == "30301"


def test_parses_demographics():
    p = parse_barcode(build_aamva(dl_fields(sex="1", eye="BRO", height="070 in")))
    assert p.sex == "M"
    assert p.eye_color == "BRO"
    assert p.height == "070 in"


def test_empty_payload_records_error():
    p = parse_barcode("")
    assert p.has_errors
    assert p.license_number is None


def test_missing_header_records_error():
    p = parse_barcode("this is not a barcode")
    assert p.has_errors


def test_field_map_covers_core_aamva_codes():
    for code in ("DAQ", "DCS", "DAC", "DBB", "DBA", "DAJ", "DAK"):
        assert code in AAMVA_FIELD_MAP


def test_looks_like_pdf417_detection():
    assert looks_like_pdf417(build_aamva(dl_fields()))
    assert not looks_like_pdf417("P<USADOE<<JOHN")
