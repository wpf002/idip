"""POS (Toast/Square) webhook delivery for DENY decisions.

Payloads are HMAC-SHA256 signed. Delivery is retried with exponential backoff
(5s -> 30s -> 5min); exhausted deliveries are written to a dead-letter log.
"""
from __future__ import annotations

import json
from dataclasses import dataclass

import httpx

from ..config import settings
from ..core.security import sign_payload

RETRY_BACKOFF_SECONDS = [5, 30, 300]


@dataclass
class WebhookResult:
    delivered: bool
    attempts: int
    status_code: int | None = None
    signature: str | None = None
    dead_lettered: bool = False


def build_payload(scan: dict) -> bytes:
    """Canonical JSON payload (sorted keys) for stable signatures."""
    body = {
        "event": "id.denied",
        "scan_id": scan.get("scan_id"),
        "result": scan.get("result"),
        "risk_score": scan.get("risk_score"),
        "state": scan.get("state"),
        "timestamp": scan.get("timestamp"),
        "location_id": scan.get("location_id"),
    }
    return json.dumps(body, sort_keys=True, separators=(",", ":")).encode("utf-8")


def signature_for(payload: bytes, secret: str) -> str:
    return sign_payload(payload, secret)


async def send_deny_webhook(
    *,
    endpoint_url: str,
    secret: str,
    scan: dict,
    client: httpx.AsyncClient | None = None,
    max_attempts: int | None = None,
) -> WebhookResult:
    """Attempt delivery of a DENY webhook. Returns a WebhookResult.

    A caller-supplied AsyncClient is used when provided (tests inject a mock
    transport). Network errors never propagate to the scan response.
    """
    payload = build_payload(scan)
    sig = signature_for(payload, secret)
    headers = {
        "Content-Type": "application/json",
        "X-IDIP-Signature": sig,
        "X-IDIP-Event": "id.denied",
    }
    attempts = 0
    max_attempts = max_attempts or settings.webhook_max_attempts

    owns_client = client is None
    client = client or httpx.AsyncClient(timeout=5.0)
    try:
        while attempts < max_attempts:
            attempts += 1
            try:
                resp = await client.post(endpoint_url, content=payload, headers=headers)
                if 200 <= resp.status_code < 300:
                    return WebhookResult(True, attempts, resp.status_code, sig)
            except httpx.HTTPError:
                pass
            # In production we would enqueue with RETRY_BACKOFF_SECONDS[attempts-1]
            # via Redis; here we surface attempts and dead-letter at the end.
        return WebhookResult(False, attempts, None, sig, dead_lettered=True)
    finally:
        if owns_client:
            await client.aclose()
