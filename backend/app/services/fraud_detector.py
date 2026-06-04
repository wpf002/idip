"""Fraud detection: duplicate scans and cross-location repeat offenders."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.models import Scan
from .risk_scorer import flag
from .violations import DUPLICATE_SCAN, REPEAT_OFFENDER, Violation

DUPLICATE_WINDOW = timedelta(hours=1)


async def detect_fraud(
    session: AsyncSession,
    *,
    hashed_license_number: str | None,
    location_id: str | None,
    duplicate_weight: int = 20,
    now: datetime | None = None,
) -> list[Violation]:
    """Return fraud violations based on prior scan history."""
    violations: list[Violation] = []
    if not hashed_license_number:
        return violations

    now = now or datetime.now(timezone.utc)

    # Duplicate scan: same license at same location within the window.
    if location_id:
        cutoff = now - DUPLICATE_WINDOW
        dup = await session.scalar(
            select(Scan.id)
            .where(Scan.hashed_license_number == hashed_license_number)
            .where(Scan.location_id == location_id)
            .where(Scan.timestamp >= cutoff)
            .limit(1)
        )
        if dup:
            violations.append(
                Violation(DUPLICATE_SCAN, "duplicate scan within 1h window", duplicate_weight)
            )

    # Cross-location repeat offender: same license previously DENY'd, or seen
    # at a different location.
    condition = Scan.result == "DENY"
    if location_id is not None:
        condition = condition | (Scan.location_id != location_id)
    offender = await session.scalar(
        select(Scan.id)
        .where(Scan.hashed_license_number == hashed_license_number)
        .where(condition)
        .limit(1)
    )
    if offender:
        violations.append(flag(REPEAT_OFFENDER, message="cross-location repeat offender"))

    return violations
