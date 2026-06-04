"""Age and expiration verification."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from ..config import settings


@dataclass
class AgeResult:
    age: int | None
    is_valid_age: bool
    is_underage: bool
    is_future_dob: bool


def _parse_iso(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def calculate_age(dob: str | None, *, today: date | None = None) -> int | None:
    today = today or date.today()
    d = _parse_iso(dob)
    if d is None:
        return None
    age = today.year - d.year - ((today.month, today.day) < (d.month, d.day))
    return age


def verify_age(
    dob: str | None, *, minimum_age: int | None = None, today: date | None = None
) -> AgeResult:
    today = today or date.today()
    minimum_age = settings.minimum_age if minimum_age is None else minimum_age
    d = _parse_iso(dob)
    if d is None:
        return AgeResult(age=None, is_valid_age=False, is_underage=False,
                         is_future_dob=False)
    if d > today:
        return AgeResult(age=None, is_valid_age=False, is_underage=False,
                         is_future_dob=True)
    age = calculate_age(dob, today=today)
    is_underage = age is not None and age < minimum_age
    return AgeResult(
        age=age,
        is_valid_age=(age is not None and age >= minimum_age),
        is_underage=is_underage,
        is_future_dob=False,
    )


def is_expired(expiration_date: str | None, *, today: date | None = None) -> bool:
    """Zero grace period — expired the day after the printed date."""
    today = today or date.today()
    exp = _parse_iso(expiration_date)
    if exp is None:
        return False
    return exp < today
