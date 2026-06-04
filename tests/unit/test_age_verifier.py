"""Unit tests for age and expiration verification."""
from datetime import date

from app.services.age_verifier import (
    calculate_age,
    is_expired,
    verify_age,
)

TODAY = date(2026, 6, 4)


def test_calculate_age_basic():
    assert calculate_age("1990-01-15", today=TODAY) == 36


def test_calculate_age_birthday_not_yet_reached():
    assert calculate_age("1990-12-31", today=TODAY) == 35


def test_calculate_age_birthday_today():
    assert calculate_age("2000-06-04", today=TODAY) == 26


def test_calculate_age_invalid_returns_none():
    assert calculate_age("not-a-date", today=TODAY) is None


def test_verify_age_adult_is_valid():
    res = verify_age("1990-01-15", today=TODAY)
    assert res.age == 36
    assert res.is_valid_age is True
    assert res.is_underage is False


def test_verify_age_underage():
    res = verify_age("2010-06-01", today=TODAY)
    assert res.is_underage is True
    assert res.is_valid_age is False


def test_verify_age_exactly_21_is_valid():
    res = verify_age("2005-06-04", today=TODAY)
    assert res.age == 21
    assert res.is_valid_age is True
    assert res.is_underage is False


def test_verify_age_one_day_under_21():
    res = verify_age("2005-06-05", today=TODAY)
    assert res.age == 20
    assert res.is_underage is True


def test_verify_age_future_dob():
    res = verify_age("2030-01-01", today=TODAY)
    assert res.is_future_dob is True
    assert res.is_valid_age is False


def test_is_expired_past_date():
    assert is_expired("2020-01-01", today=TODAY) is True


def test_is_expired_future_and_today_no_grace():
    assert is_expired("2030-01-01", today=TODAY) is False
    # Zero grace: expires the day after the printed date, so today is still ok.
    assert is_expired("2026-06-04", today=TODAY) is False
