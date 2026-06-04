"""Security primitives: HMAC hashing, API key generation, constant-time compare."""
from __future__ import annotations

import hashlib
import hmac
import secrets

from ..config import settings


def hmac_hash(value: str, *, secret: str | None = None) -> str:
    """Return a hex HMAC-SHA256 of ``value``. Used to store document numbers
    without ever persisting raw PII."""
    key = (secret or settings.hmac_secret).encode("utf-8")
    return hmac.new(key, value.encode("utf-8"), hashlib.sha256).hexdigest()


def sha256_hash(value: str) -> str:
    """Plain SHA-256 hex digest (used for PIN parity checks in tests)."""
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def generate_api_key(nbytes: int | None = None) -> str:
    """Generate a URL-safe random API key."""
    return "idip_" + secrets.token_urlsafe(nbytes or settings.api_key_bytes)


def constant_time_compare(a: str, b: str) -> bool:
    """Timing-attack-safe string comparison."""
    return hmac.compare_digest(a.encode("utf-8"), b.encode("utf-8"))


def sign_payload(payload: bytes, secret: str) -> str:
    """HMAC-SHA256 signature for outgoing webhook payloads."""
    return hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
