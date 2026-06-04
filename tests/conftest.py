"""Pytest fixtures: SQLite test DB, ASGI client, seeded location, and ID fixtures."""
from __future__ import annotations

import os
import pathlib
import tempfile

# Configure the environment BEFORE importing the app so the engine and settings
# bind to the test database and skip Redis.
TEST_DB_PATH = pathlib.Path(tempfile.gettempdir()) / "idip_test.db"
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{TEST_DB_PATH}"
os.environ["REDIS_URL"] = ""

import pytest  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402

from app.core.security import generate_api_key  # noqa: E402
from app.database import Base, async_session_factory, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models.models import Location  # noqa: E402

from .factories import (  # noqa: E402
    build_aamva,
    build_td1,
    build_td3,
    dl_fields,
)


@pytest.fixture(autouse=True)
async def _reset_schema():
    """Fresh schema per test for isolation."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield


@pytest.fixture
async def db():
    async with async_session_factory() as session:
        yield session


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as c:
        yield c


@pytest.fixture
async def location(db):
    loc = Location(
        name="Test Bar",
        address="100 Main St",
        city="Dallas",
        state_code="TX",
        api_key=generate_api_key(),
        is_active=True,
    )
    db.add(loc)
    await db.commit()
    await db.refresh(loc)
    return loc


@pytest.fixture
def auth_headers(location):
    return {"Authorization": f"Bearer {location.api_key}"}


# ---- ID payload fixtures ----
@pytest.fixture
def adult_dl() -> str:
    return build_aamva(dl_fields(dob="01151990", expiration="01152035"))


@pytest.fixture
def underage_dl() -> str:
    # ~16 years old relative to a 2026 "today".
    return build_aamva(dl_fields(dob="06012010", expiration="06012035"))


@pytest.fixture
def expired_dl() -> str:
    return build_aamva(dl_fields(dob="01151990", expiration="01152018"))


@pytest.fixture
def bad_format_dl() -> str:
    # TX requires 8 numeric digits; "ABC123" violates the regex.
    return build_aamva(dl_fields(license_number="ABC123"))


@pytest.fixture
def valid_passport_td3() -> str:
    return build_td3(dob="900115", expiry="350115")


@pytest.fixture
def invalid_mrz_check_digit() -> str:
    return build_td3(corrupt_check=True)


@pytest.fixture
def intl_id_unknown_country() -> str:
    return build_td1(issuer="ZZZ", nationality="ZZZ")
