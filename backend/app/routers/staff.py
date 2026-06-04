"""Staff management endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import sha256_hash
from ..database import get_db
from ..models.models import Location, Staff
from ..schemas import StaffCreate, StaffResponse, StaffUpdate

router = APIRouter(prefix="/admin", tags=["staff"])


def _to_response(s: Staff) -> StaffResponse:
    return StaffResponse(
        id=s.id, location_id=s.location_id, name=s.name, role=s.role,
        is_active=s.is_active,
    )


@router.post("/location/{location_id}/staff", response_model=StaffResponse, status_code=201)
async def create_staff(
    location_id: str, payload: StaffCreate, db: AsyncSession = Depends(get_db)
) -> StaffResponse:
    location = await db.get(Location, location_id)
    if location is None:
        raise HTTPException(status_code=404, detail="location not found")
    staff = Staff(
        location_id=location_id,
        name=payload.name,
        role=payload.role,
        pin_hash=sha256_hash(payload.pin) if payload.pin else None,
        is_active=True,
    )
    db.add(staff)
    await db.commit()
    await db.refresh(staff)
    return _to_response(staff)


@router.get("/location/{location_id}/staff", response_model=list[StaffResponse])
async def list_staff(
    location_id: str, db: AsyncSession = Depends(get_db)
) -> list[StaffResponse]:
    rows = (
        await db.scalars(select(Staff).where(Staff.location_id == location_id))
    ).all()
    return [_to_response(s) for s in rows]


@router.patch("/staff/{staff_id}", response_model=StaffResponse)
async def update_staff(
    staff_id: str, payload: StaffUpdate, db: AsyncSession = Depends(get_db)
) -> StaffResponse:
    staff = await db.get(Staff, staff_id)
    if staff is None:
        raise HTTPException(status_code=404, detail="staff not found")
    if payload.name is not None:
        staff.name = payload.name
    if payload.role is not None:
        staff.role = payload.role
    if payload.is_active is not None:
        staff.is_active = payload.is_active
    await db.commit()
    await db.refresh(staff)
    return _to_response(staff)


@router.delete("/staff/{staff_id}", status_code=204, response_class=Response)
async def delete_staff(staff_id: str, db: AsyncSession = Depends(get_db)) -> Response:
    staff = await db.get(Staff, staff_id)
    if staff is None:
        raise HTTPException(status_code=404, detail="staff not found")
    await db.delete(staff)
    await db.commit()
    return Response(status_code=204)
