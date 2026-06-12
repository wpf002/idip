"""Async SQLAlchemy engine, session factory, and Base."""
from __future__ import annotations

import os
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from .config import settings


class Base(DeclarativeBase):
    pass


def _db_url() -> str:
    # Allow env override (tests set DATABASE_URL to sqlite+aiosqlite).
    url = os.getenv("DATABASE_URL", settings.database_url)
    # Managed Postgres providers (Render/Heroku/etc.) hand out a "postgres://"
    # or "postgresql://" URL; the async engine needs the asyncpg driver.
    if url.startswith("postgres://"):
        url = "postgresql+asyncpg://" + url[len("postgres://"):]
    elif url.startswith("postgresql://"):
        url = "postgresql+asyncpg://" + url[len("postgresql://"):]
    return url


engine = create_async_engine(_db_url(), future=True, echo=False)

async_session_factory = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session


async def init_db() -> None:
    """Create all tables. Used for SQLite/dev; prod uses Alembic."""
    # Import models so they register on Base.metadata.
    from .models import models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
