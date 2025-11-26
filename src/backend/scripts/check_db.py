#!/usr/bin/env python3
"""Database connection check script."""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from config.settings import get_settings


async def check_database_connection() -> bool:
    """Check if database connection is successful."""
    settings = get_settings()
    print(f"Checking database connection...")
    print(f"Database URL: {settings.database_url.replace(settings.database_url.split('@')[0].split('//')[1], '***')}")

    try:
        engine = create_async_engine(settings.database_url, echo=False)
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            _ = result.scalar()
            print("Database connection: OK")
            return True
    except Exception as e:
        print(f"Database connection: FAILED")
        print(f"Error: {e}")
        return False
    finally:
        await engine.dispose()


async def check_database_version() -> str | None:
    """Get PostgreSQL version."""
    settings = get_settings()

    try:
        engine = create_async_engine(settings.database_url, echo=False)
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT version()"))
            version = result.scalar()
            print(f"PostgreSQL version: {version}")
            return version
    except Exception as e:
        print(f"Failed to get PostgreSQL version: {e}")
        return None
    finally:
        await engine.dispose()


async def main() -> None:
    """Run all database checks."""
    print("=" * 60)
    print("SalonMate Database Connection Check")
    print("=" * 60)

    success = await check_database_connection()

    if success:
        await check_database_version()
        print("=" * 60)
        print("All checks passed!")
        sys.exit(0)
    else:
        print("=" * 60)
        print("Database check failed!")
        print("Make sure PostgreSQL is running and credentials are correct.")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
