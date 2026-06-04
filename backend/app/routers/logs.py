"""Compliance log endpoints — paginated history and CSV export."""
from __future__ import annotations

import csv
import io
from datetime import date, datetime

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models.models import Location, Scan
from .deps import get_current_location

router = APIRouter(prefix="/v1", tags=["logs"])


def _apply_filters(stmt, location_id, decision, state, start, end):
    stmt = stmt.where(Scan.location_id == location_id)
    if decision:
        stmt = stmt.where(Scan.result == decision.upper())
    if state:
        stmt = stmt.where(Scan.state_code == state.upper())
    if start:
        stmt = stmt.where(Scan.timestamp >= datetime.combine(start, datetime.min.time()))
    if end:
        stmt = stmt.where(Scan.timestamp <= datetime.combine(end, datetime.max.time()))
    return stmt


@router.get("/logs")
async def get_logs(
    decision: str | None = Query(default=None),
    state: str | None = Query(default=None),
    start: date | None = Query(default=None),
    end: date | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    location: Location = Depends(get_current_location),
    db: AsyncSession = Depends(get_db),
) -> dict:
    stmt = _apply_filters(select(Scan), location.id, decision, state, start, end)
    stmt = stmt.order_by(Scan.timestamp.desc()).limit(limit).offset(offset)
    rows = (await db.scalars(stmt)).all()
    items = [
        {
            "scan_id": r.id,
            "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            "result": r.result,
            "risk_score": r.risk_score,
            "state": r.state_code,
            "age": r.age,
            "document_type": r.document_type,
            "scan_method": r.scan_method,
            "flags": r.flags,
        }
        for r in rows
    ]
    return {"items": items, "limit": limit, "offset": offset, "count": len(items)}


@router.get("/logs/export")
async def export_logs(
    decision: str | None = Query(default=None),
    state: str | None = Query(default=None),
    start: date | None = Query(default=None),
    end: date | None = Query(default=None),
    location: Location = Depends(get_current_location),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    stmt = _apply_filters(select(Scan), location.id, decision, state, start, end)
    stmt = stmt.order_by(Scan.timestamp.desc())
    rows = (await db.scalars(stmt)).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        ["scan_id", "timestamp", "result", "risk_score", "state", "age",
         "document_type", "scan_method"]
    )
    for r in rows:
        writer.writerow(
            [r.id, r.timestamp.isoformat() if r.timestamp else "", r.result,
             r.risk_score, r.state_code or "", r.age if r.age is not None else "",
             r.document_type or "", r.scan_method]
        )
    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=idip_logs.csv"},
    )
