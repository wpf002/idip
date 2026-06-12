"""Pydantic request/response schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


# ---- Scan ----
class ScanRequest(BaseModel):
    barcode_data: str
    document_input_type: str = "AUTO"  # PDF417 | MRZ | AUTO
    staff_id: str | None = None
    scan_method: str = "camera"  # camera | manual
    client_timestamp: datetime | None = None


class ScanResponse(BaseModel):
    scan_id: str
    timestamp: datetime
    document_type: str | None
    age: int | None
    is_valid_age: bool
    is_expired: bool
    risk_score: int
    result: str
    flags: list[dict]
    state: str | None
    name: str | None
    sex: str | None = None
    height: str | None = None
    eye_color: str | None = None
    hair_color: str | None = None
    nationality: str | None = None
    issuing_country: str | None = None
    parse_errors: list[str] = Field(default_factory=list)
    challenge_available: bool = False
    challenge_required: bool = False


# ---- Challenge ----
class ChallengeRequest(BaseModel):
    scan_id: str
    barcode_data: str | None = None
    answers: dict[str, str] | None = None
    failures: int | None = None


class ChallengeResponse(BaseModel):
    scan_id: str
    failures: int
    risk_score: int
    result: str
    flags: list[dict]


# ---- Sync ----
class SyncResult(BaseModel):
    client_timestamp: datetime | None = None
    scan_id: str
    result: str
    risk_score: int


class SyncResponse(BaseModel):
    synced: int
    results: list[SyncResult]


# ---- Admin: location ----
class LocationCreate(BaseModel):
    name: str
    address: str | None = None
    city: str | None = None
    state_code: str | None = None
    subscription_tier: str = "starter"


class LocationResponse(BaseModel):
    id: str
    name: str
    state_code: str | None
    subscription_tier: str
    api_key: str
    is_active: bool


# ---- Admin: webhook ----
class WebhookCreate(BaseModel):
    provider: str  # toast | square
    endpoint_url: str
    secret_key: str | None = None


class WebhookResponse(BaseModel):
    id: str
    location_id: str
    provider: str
    endpoint_url: str
    is_active: bool


# ---- Admin: staff ----
class StaffCreate(BaseModel):
    name: str
    role: str = "door"
    pin: str | None = None


class StaffUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
    is_active: bool | None = None


class StaffResponse(BaseModel):
    id: str
    location_id: str
    name: str
    role: str
    is_active: bool


# ---- Metrics ----
class MetricsResponse(BaseModel):
    period: str
    total_scans: int
    allow: int
    review: int
    deny: int
    underage_blocked: int
    by_state: dict[str, int]
    by_result: dict[str, int]
