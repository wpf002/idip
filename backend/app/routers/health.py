"""Health check and admin (location / rules / webhook) endpoints."""
from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import settings
from ..core.security import generate_api_key
from ..database import get_db
from ..models.models import Location, StateRule, WebhookConfig
from ..schemas import (
    LocationCreate,
    LocationResponse,
    WebhookCreate,
    WebhookResponse,
)

router = APIRouter(tags=["admin"])


@router.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": settings.app_name, "version": "1.0.0"}


@router.post("/admin/location", response_model=LocationResponse, status_code=201)
async def create_location(
    payload: LocationCreate, db: AsyncSession = Depends(get_db)
) -> LocationResponse:
    location = Location(
        name=payload.name,
        address=payload.address,
        city=payload.city,
        state_code=(payload.state_code or "").upper() or None,
        subscription_tier=payload.subscription_tier,
        api_key=generate_api_key(),
        is_active=True,
    )
    db.add(location)
    await db.commit()
    await db.refresh(location)
    return LocationResponse(
        id=location.id,
        name=location.name,
        state_code=location.state_code,
        subscription_tier=location.subscription_tier,
        api_key=location.api_key,
        is_active=location.is_active,
    )


@router.post("/admin/seed-rules")
async def seed_rules(db: AsyncSession = Depends(get_db)) -> dict:
    """Upsert all state rule JSON files into the state_rules table."""
    count = 0
    for path in sorted(settings.state_rules_dir.glob("*.json")):
        try:
            data = json.loads(path.read_text())
        except (json.JSONDecodeError, OSError):
            continue
        code = data.get("state_code") or path.stem
        existing = await db.get(StateRule, code)
        if existing:
            existing.state_name = data.get("state_name", existing.state_name)
            existing.version = data.get("version", existing.version)
            existing.rules = data
        else:
            db.add(
                StateRule(
                    state_code=code,
                    state_name=data.get("state_name", code),
                    version=data.get("version", "1.0"),
                    rules=data,
                )
            )
        count += 1
    await db.commit()
    return {"seeded": count}


@router.post(
    "/admin/location/{location_id}/webhooks",
    response_model=WebhookResponse,
    status_code=201,
)
async def create_webhook(
    location_id: str,
    payload: WebhookCreate,
    db: AsyncSession = Depends(get_db),
) -> WebhookResponse:
    location = await db.get(Location, location_id)
    if location is None:
        raise HTTPException(status_code=404, detail="location not found")
    cfg = WebhookConfig(
        location_id=location_id,
        provider=payload.provider,
        endpoint_url=payload.endpoint_url,
        secret_key=payload.secret_key,
        is_active=True,
    )
    db.add(cfg)
    await db.commit()
    await db.refresh(cfg)
    return WebhookResponse(
        id=cfg.id,
        location_id=cfg.location_id,
        provider=cfg.provider,
        endpoint_url=cfg.endpoint_url,
        is_active=cfg.is_active,
    )
