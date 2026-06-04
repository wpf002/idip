"""Redis-backed cache with an in-memory fallback.

If Redis is unreachable (common in dev/tests) the cache degrades silently to a
process-local dict with TTL semantics so callers never have to special-case it.
"""
from __future__ import annotations

import time
from typing import Any

try:  # redis is optional at runtime
    import redis.asyncio as aioredis
except Exception:  # pragma: no cover
    aioredis = None  # type: ignore

from ..config import settings


class _MemoryCache:
    def __init__(self) -> None:
        self._store: dict[str, tuple[Any, float | None]] = {}

    def _expired(self, key: str) -> bool:
        item = self._store.get(key)
        if not item:
            return True
        _, expiry = item
        if expiry is not None and expiry < time.monotonic():
            self._store.pop(key, None)
            return True
        return False

    async def get(self, key: str) -> Any:
        if self._expired(key):
            return None
        return self._store[key][0]

    async def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        expiry = time.monotonic() + ttl if ttl else None
        self._store[key] = (value, expiry)

    async def incr(self, key: str, ttl: int | None = None) -> int:
        current = 0 if self._expired(key) else int(self._store[key][0])
        current += 1
        expiry = self._store[key][1] if not self._expired(key) else (
            time.monotonic() + ttl if ttl else None
        )
        self._store[key] = (current, expiry)
        return current

    async def delete(self, key: str) -> None:
        self._store.pop(key, None)


class Cache:
    def __init__(self) -> None:
        self._redis = None
        self._memory = _MemoryCache()
        self._use_redis = False

    async def connect(self) -> None:
        if aioredis is None or not settings.redis_url:
            self._use_redis = False
            return
        try:
            self._redis = aioredis.from_url(
                settings.redis_url, decode_responses=True
            )
            await self._redis.ping()
            self._use_redis = True
        except Exception:
            self._use_redis = False
            self._redis = None

    async def disconnect(self) -> None:
        if self._redis is not None:
            try:
                await self._redis.aclose()
            except Exception:
                pass

    async def get(self, key: str) -> Any:
        if self._use_redis and self._redis is not None:
            try:
                return await self._redis.get(key)
            except Exception:
                self._use_redis = False
        return await self._memory.get(key)

    async def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        if self._use_redis and self._redis is not None:
            try:
                await self._redis.set(key, value, ex=ttl)
                return
            except Exception:
                self._use_redis = False
        await self._memory.set(key, value, ttl)

    async def incr(self, key: str, ttl: int | None = None) -> int:
        if self._use_redis and self._redis is not None:
            try:
                count = await self._redis.incr(key)
                if count == 1 and ttl:
                    await self._redis.expire(key, ttl)
                return count
            except Exception:
                self._use_redis = False
        return await self._memory.incr(key, ttl)

    async def delete(self, key: str) -> None:
        if self._use_redis and self._redis is not None:
            try:
                await self._redis.delete(key)
                return
            except Exception:
                self._use_redis = False
        await self._memory.delete(key)


cache = Cache()
