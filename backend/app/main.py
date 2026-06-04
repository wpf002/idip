"""IDIP FastAPI application — app factory, lifespan, router registration."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI

from .config import settings
from .core.cache import cache
from .database import init_db
from .routers import health, logs, metrics, scan, staff


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await cache.connect()
    yield
    await cache.disconnect()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        description="ID scanning, fraud/age risk scoring, and compliance audit trail.",
        lifespan=lifespan,
    )
    app.include_router(health.router)
    app.include_router(scan.router)
    app.include_router(logs.router)
    app.include_router(metrics.router)
    app.include_router(staff.router)
    return app


app = create_app()
