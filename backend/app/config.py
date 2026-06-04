"""Application configuration via pydantic-settings."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Core
    app_name: str = "IDIP"
    environment: str = "development"
    debug: bool = True

    # Database — async SQLAlchemy URL. Tests override with sqlite+aiosqlite.
    database_url: str = "postgresql+asyncpg://idip:idip@localhost:5433/idip"

    # Redis cache (optional — in-memory fallback when unreachable)
    redis_url: str | None = "redis://localhost:6380/0"

    # Security
    secret_key: str = "dev-insecure-secret-change-me"
    hmac_secret: str = "dev-insecure-hmac-change-me"
    api_key_bytes: int = 32

    # Compliance / retention
    scan_retention_days: int = 365
    min_retention_days: int = 365  # regulatory floor (TX/GA)

    # Risk thresholds (defaults; per-state rules can override)
    allow_max: int = 30
    review_max: int = 70

    # Drinking age
    minimum_age: int = 21

    # Rate limiting
    scan_rate_limit_per_min: int = 30

    # Webhooks
    webhook_max_attempts: int = 3

    @property
    def state_rules_dir(self) -> Path:
        return Path(__file__).resolve().parent / "state_rules"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
