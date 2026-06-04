"""Shared router dependencies — API key authentication."""
from __future__ import annotations

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import constant_time_compare
from ..database import get_db
from ..models.models import Location


async def get_current_location(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> Location:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header",
        )
    token = authorization.split(" ", 1)[1].strip()
    location = await db.scalar(select(Location).where(Location.api_key == token))
    if (
        location is None
        or not location.is_active
        or not constant_time_compare(location.api_key, token)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key"
        )
    return location
