"""Aggregated metrics endpoint."""
from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models.models import Location, Scan
from ..schemas import MetricsResponse
from .deps import get_current_location

router = APIRouter(prefix="/v1", tags=["metrics"])


def _period_start(period: str, now: datetime) -> datetime | None:
    period = (period or "today").lower()
    if period in ("today", "tonight"):
        return now.replace(hour=0, minute=0, second=0, microsecond=0)
    if period in ("this_week", "week"):
        return now - timedelta(days=7)
    if period in ("this_month", "month"):
        return now - timedelta(days=30)
    m = re.fullmatch(r"(\d+)d", period)
    if m:
        return now - timedelta(days=int(m.group(1)))
    return None  # all-time


@router.get("/metrics", response_model=MetricsResponse)
async def metrics(
    period: str = Query(default="today"),
    location: Location = Depends(get_current_location),
    db: AsyncSession = Depends(get_db),
) -> MetricsResponse:
    now = datetime.now(timezone.utc)
    start = _period_start(period, now)

    base = select(Scan).where(Scan.location_id == location.id)
    if start is not None:
        base = base.where(Scan.timestamp >= start)

    rows = (await db.scalars(base)).all()

    by_result: dict[str, int] = {}
    by_state: dict[str, int] = {}
    underage = 0
    for r in rows:
        by_result[r.result] = by_result.get(r.result, 0) + 1
        if r.state_code:
            by_state[r.state_code] = by_state.get(r.state_code, 0) + 1
        if any(f.get("code") == "UNDERAGE" for f in (r.flags or [])):
            underage += 1

    return MetricsResponse(
        period=period,
        total_scans=len(rows),
        allow=by_result.get("ALLOW", 0),
        review=by_result.get("REVIEW", 0),
        deny=by_result.get("DENY", 0),
        underage_blocked=underage,
        by_state=by_state,
        by_result=by_result,
    )
