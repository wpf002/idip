"""Unit tests for the JSON-driven state rules engine."""
from app.services.barcode_parser import parse_barcode
from app.services.state_rules_engine import (
    fraud_weights,
    load_rules,
    thresholds,
    validate,
)
from app.services.violations import (
    MISSING_REQUIRED_FIELD,
    REGEX_MISMATCH,
)

from tests.factories import build_aamva, dl_fields


def test_load_tx_rules():
    rules = load_rules("TX")
    assert rules["state_code"] == "TX"
    assert rules["license_number"]["regex"] == "^[0-9]{8}$"


def test_load_unknown_falls_back_to_default():
    rules = load_rules("ZZ")
    assert rules["state_code"] == "DEFAULT"


def test_load_none_falls_back_to_default():
    rules = load_rules(None)
    assert rules["state_code"] == "DEFAULT"


def test_tx_expired_weight_is_50():
    assert fraud_weights(load_rules("TX"))["expired_weight"] == 50


def test_non_tx_expired_weight_is_40():
    assert fraud_weights(load_rules("CA"))["expired_weight"] == 40


def test_ca_license_regex():
    assert load_rules("CA")["license_number"]["regex"] == "^[A-Z][0-9]{7}$"


def test_default_thresholds():
    t = thresholds(load_rules("TX"))
    assert t["allow_max"] == 30
    assert t["review_max"] == 70


def test_fraud_weights_include_duplicate():
    assert fraud_weights(load_rules("GA"))["duplicate_scan_weight"] == 20


def test_validate_clean_dl_has_no_violations():
    p = parse_barcode(build_aamva(dl_fields(state="TX", license_number="12345678")))
    assert validate(p, load_rules("TX")) == []


def test_validate_flags_bad_license_number():
    p = parse_barcode(build_aamva(dl_fields(state="TX", license_number="ABC123")))
    violations = validate(p, load_rules("TX"))
    assert any(v.code == REGEX_MISMATCH for v in violations)


def test_validate_flags_missing_required_field():
    fields = dl_fields(state="TX")
    del fields["DAK"]  # remove postal code (required)
    p = parse_barcode(build_aamva(fields))
    violations = validate(p, load_rules("TX"))
    assert any(v.code == MISSING_REQUIRED_FIELD for v in violations)


def test_validate_flags_bad_postal_code():
    p = parse_barcode(build_aamva(dl_fields(state="TX", postal="BADZIP")))
    violations = validate(p, load_rules("TX"))
    assert any(v.code == REGEX_MISMATCH for v in violations)


def test_validate_accepts_9_digit_zip():
    # AAMVA barcodes often encode ZIP+4 as 9 digits with no hyphen.
    p = parse_barcode(build_aamva(dl_fields(state="TX", postal="752480000")))
    violations = validate(p, load_rules("TX"))
    assert not any(v.code == REGEX_MISMATCH for v in violations)
