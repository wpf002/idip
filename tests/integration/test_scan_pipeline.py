"""Integration tests for the end-to-end scan pipeline (decision_engine)."""
from datetime import date

from app.services import audit_logger
from app.services.decision_engine import run_pipeline
from app.services.risk_scorer import ALLOW, DENY, REVIEW

TODAY = date(2026, 6, 4)


async def test_adult_clean_dl_is_allow(db, location, adult_dl):
    d = await run_pipeline(
        db, raw_data=adult_dl, location_id=location.id,
        location_state="TX", today=TODAY,
    )
    assert d.result == ALLOW
    assert d.age == 36
    assert d.is_valid_age is True
    assert d.hashed_license_number is not None


async def test_underage_dl_is_deny(db, location, underage_dl):
    d = await run_pipeline(
        db, raw_data=underage_dl, location_id=location.id,
        location_state="TX", today=TODAY,
    )
    assert d.result == DENY
    assert any(f["code"] == "UNDERAGE" for f in d.flags)


async def test_expired_dl_is_review(db, location, expired_dl):
    d = await run_pipeline(
        db, raw_data=expired_dl, location_id=location.id,
        location_state="TX", today=TODAY,
    )
    assert d.is_expired is True
    assert d.result == REVIEW
    # TX (TABC) expired weight is 50.
    assert d.risk_score == 50


async def test_valid_passport_is_allow(db, location, valid_passport_td3):
    d = await run_pipeline(
        db, raw_data=valid_passport_td3, location_id=location.id,
        document_input_type="MRZ", today=TODAY,
    )
    assert d.result == ALLOW
    assert d.parsed.document_type == "US_PASSPORT"


async def test_invalid_mrz_check_digit_is_review(db, location, invalid_mrz_check_digit):
    d = await run_pipeline(
        db, raw_data=invalid_mrz_check_digit, location_id=location.id,
        document_input_type="MRZ", today=TODAY,
    )
    assert any(f["code"] == "MRZ_CHECK_DIGIT_FAILURE" for f in d.flags)
    assert d.result == REVIEW


async def test_duplicate_scan_is_flagged(db, location, adult_dl):
    first = await run_pipeline(
        db, raw_data=adult_dl, location_id=location.id,
        location_state="TX", today=TODAY,
    )
    await audit_logger.log_scan(
        db,
        hashed_license_number=first.hashed_license_number,
        state_code=first.state, dob=first.parsed.date_of_birth, age=first.age,
        expiration_date=first.parsed.expiration_date, risk_score=first.risk_score,
        result=first.result, flags=first.flags,
        document_type=first.parsed.document_type, location_id=location.id,
        staff_id=None, scan_method="camera",
    )
    second = await run_pipeline(
        db, raw_data=adult_dl, location_id=location.id,
        location_state="TX", today=TODAY,
    )
    assert any(f["code"] == "DUPLICATE_SCAN" for f in second.flags)
