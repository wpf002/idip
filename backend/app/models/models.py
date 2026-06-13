"""SQLAlchemy ORM models.

UUID primary keys are stored as 36-char strings for portability across
PostgreSQL (prod) and SQLite (tests). JSON columns use the generic ``JSON``
type which maps to JSONB on Postgres and TEXT-backed JSON on SQLite.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Location(Base):
    __tablename__ = "locations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    address: Mapped[str | None] = mapped_column(String(500))
    city: Mapped[str | None] = mapped_column(String(100))
    state_code: Mapped[str | None] = mapped_column(String(2))
    subscription_tier: Mapped[str] = mapped_column(String(20), default="starter")
    api_key: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    scans: Mapped[list["Scan"]] = relationship(back_populates="location")
    staff: Mapped[list["Staff"]] = relationship(back_populates="location")
    webhooks: Mapped[list["WebhookConfig"]] = relationship(back_populates="location")


class Scan(Base):
    __tablename__ = "scans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, index=True
    )
    hashed_license_number: Mapped[str | None] = mapped_column(String(128), index=True)
    state_code: Mapped[str | None] = mapped_column(String(2), index=True)
    dob: Mapped[str | None] = mapped_column(String(10))
    age: Mapped[int | None] = mapped_column(Integer)
    expiration_date: Mapped[str | None] = mapped_column(String(10))
    risk_score: Mapped[int] = mapped_column(Integer, default=0)
    result: Mapped[str] = mapped_column(String(10), index=True)
    flags: Mapped[list] = mapped_column(JSON, default=list)
    document_type: Mapped[str | None] = mapped_column(String(40))
    location_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("locations.id"), index=True
    )
    staff_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("staff.id"))
    scan_method: Mapped[str] = mapped_column(String(10), default="camera")
    synced: Mapped[bool] = mapped_column(Boolean, default=True)
    client_timestamp: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    location: Mapped["Location"] = relationship(back_populates="scans")


class Staff(Base):
    __tablename__ = "staff"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    location_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("locations.id"), index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="door")
    pin_hash: Mapped[str | None] = mapped_column(String(128))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    location: Mapped["Location"] = relationship(back_populates="staff")


class StateRule(Base):
    __tablename__ = "state_rules"

    # Wider than 2 chars to hold the "DEFAULT" sentinel rule set (Postgres
    # enforces VARCHAR length; SQLite does not).
    state_code: Mapped[str] = mapped_column(String(16), primary_key=True)
    state_name: Mapped[str] = mapped_column(String(50))
    version: Mapped[str] = mapped_column(String(10), default="1.0")
    rules: Mapped[dict] = mapped_column(JSON, default=dict)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )


class WebhookConfig(Base):
    __tablename__ = "webhook_configs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    location_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("locations.id"), index=True
    )
    provider: Mapped[str] = mapped_column(String(20))  # toast | square
    endpoint_url: Mapped[str] = mapped_column(String(500))
    secret_key: Mapped[str | None] = mapped_column(String(128))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    location: Mapped["Location"] = relationship(back_populates="webhooks")
