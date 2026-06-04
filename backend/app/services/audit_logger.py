"""Async, fire-and-forget audit logging of scans to the database."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from ..models.models import Scan


async def log_scan(
    session: AsyncSession,
    *,
    scan_id: str | None = None,
    hashed_license_number: str | None,
    state_code: str | None,
    dob: str | None,
    age: int | None,
    expiration_date: str | None,
    risk_score: int,
    result: str,
    flags: list[dict],
    document_type: str | None,
    location_id: str | None,
    staff_id: str | None,
    scan_method: str = "camera",
    synced: bool = True,
    client_timestamp: datetime | None = None,
    timestamp: datetime | None = None,
) -> Scan:
    """Persist a scan record and return it (committed)."""
    scan = Scan(
        hashed_license_number=hashed_license_number,
        state_code=state_code,
        dob=dob,
        age=age,
        expiration_date=expiration_date,
        risk_score=risk_score,
        result=result,
        flags=flags or [],
        document_type=document_type,
        location_id=location_id,
        staff_id=staff_id,
        scan_method=scan_method,
        synced=synced,
        client_timestamp=client_timestamp,
        timestamp=timestamp or datetime.now(timezone.utc),
    )
    if scan_id:
        scan.id = scan_id
    session.add(scan)
    await session.commit()
    await session.refresh(scan)
    return scan
