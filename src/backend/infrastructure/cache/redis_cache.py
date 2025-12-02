"""Redis cache adapter for session and response caching."""

import json
from typing import Any

import redis.asyncio as redis

from config.settings import get_settings

settings = get_settings()


class RedisCache:
    """Redis cache client wrapper."""

    def __init__(self, url: str | None = None) -> None:
        """Initialize Redis connection."""
        self.url = url or settings.redis_url
        self._client: redis.Redis | None = None

    async def connect(self) -> None:
        """Connect to Redis."""
        if self._client is None:
            self._client = redis.from_url(
                self.url,
                encoding="utf-8",
                decode_responses=True,
            )

    async def disconnect(self) -> None:
        """Disconnect from Redis."""
        if self._client:
            await self._client.close()
            self._client = None

    @property
    def client(self) -> redis.Redis:
        """Get Redis client."""
        if self._client is None:
            raise RuntimeError("Redis client not connected. Call connect() first.")
        return self._client

    async def get(self, key: str) -> Any | None:
        """Get value from cache."""
        value = await self.client.get(key)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
        return None

    async def set(
        self,
        key: str,
        value: Any,
        ttl: int | None = None,
    ) -> bool:
        """Set value in cache with optional TTL (seconds)."""
        if isinstance(value, (dict, list)):
            value = json.dumps(value)
        result = await self.client.set(key, value, ex=ttl)
        return bool(result)

    async def delete(self, key: str) -> int:
        """Delete key from cache."""
        return await self.client.delete(key)

    async def exists(self, key: str) -> bool:
        """Check if key exists."""
        return await self.client.exists(key) > 0

    async def incr(self, key: str) -> int:
        """Increment value."""
        return await self.client.incr(key)

    async def expire(self, key: str, ttl: int) -> bool:
        """Set expiration on key."""
        return await self.client.expire(key, ttl)

    async def ping(self) -> bool:
        """Check Redis connection."""
        try:
            return await self.client.ping()
        except Exception:
            return False


# Singleton instance
_cache: RedisCache | None = None


async def get_cache() -> RedisCache:
    """Get Redis cache instance."""
    global _cache
    if _cache is None:
        _cache = RedisCache()
        await _cache.connect()
    return _cache


async def close_cache() -> None:
    """Close Redis cache connection."""
    global _cache
    if _cache:
        await _cache.disconnect()
        _cache = None
