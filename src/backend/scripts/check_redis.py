#!/usr/bin/env python3
"""Redis connection check script."""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import redis.asyncio as redis

from config.settings import get_settings


async def check_redis_connection() -> bool:
    """Check if Redis connection is successful."""
    settings = get_settings()
    print("Checking Redis connection...")
    print(f"Redis URL: {settings.redis_url}")

    try:
        client = redis.from_url(settings.redis_url)
        pong = await client.ping()
        await client.close()

        if pong:
            print("Redis connection: OK")
            return True
        else:
            print("Redis connection: FAILED (no pong)")
            return False
    except Exception as e:
        print("Redis connection: FAILED")
        print(f"Error: {e}")
        return False


async def check_redis_info() -> dict | None:
    """Get Redis server info."""
    settings = get_settings()

    try:
        client = redis.from_url(settings.redis_url)
        info = await client.info("server")
        await client.close()

        print(f"Redis version: {info.get('redis_version', 'unknown')}")
        return dict(info)
    except Exception as e:
        print(f"Failed to get Redis info: {e}")
        return None


async def main() -> None:
    """Run all Redis checks."""
    print("=" * 60)
    print("SalonMate Redis Connection Check")
    print("=" * 60)

    success = await check_redis_connection()

    if success:
        await check_redis_info()
        print("=" * 60)
        print("All checks passed!")
        sys.exit(0)
    else:
        print("=" * 60)
        print("Redis check failed!")
        print("Make sure Redis is running.")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
