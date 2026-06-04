"""Per-location scan rate limiting backed by the cache."""
from __future__ import annotations

from ..config import settings
from .cache import cache


class RateLimitExceeded(Exception):
    def __init__(self, retry_after: int = 60) -> None:
        self.retry_after = retry_after
        super().__init__("rate limit exceeded")


async def check_rate_limit(
    location_id: str, *, limit: int | None = None, window_seconds: int = 60
) -> int:
    """Increment and check the per-location request counter.

    Returns the current count. Raises RateLimitExceeded when the limit is hit.
    """
    limit = limit or settings.scan_rate_limit_per_min
    # Bucket by coarse window so counters reset.
    key = f"ratelimit:scan:{location_id}"
    count = await cache.incr(key, ttl=window_seconds)
    if count > limit:
        raise RateLimitExceeded(retry_after=window_seconds)
    return count
