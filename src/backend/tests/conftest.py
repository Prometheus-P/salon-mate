"""
pytest 설정 및 공통 fixture
"""

import asyncio
from collections.abc import AsyncGenerator
from typing import Any

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from config.database import Base, get_db
from main import app
from models.post import Post  # noqa: F401
from models.review import Review  # noqa: F401
from models.shop import Shop  # noqa: F401
from models.social_account import SocialAccount  # noqa: F401
from models.style_tag import StyleTag  # noqa: F401

# 모든 모델 임포트 (테이블 생성을 위해 필요)
from models.user import User  # noqa: F401

# 테스트용 인메모리 SQLite 데이터베이스
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def test_engine():
    """테스트용 데이터베이스 엔진"""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """테스트용 데이터베이스 세션"""
    async_session_factory = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    async with async_session_factory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """테스트용 HTTP 클라이언트"""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def valid_user_data() -> dict[str, Any]:
    """유효한 사용자 데이터"""
    return {
        "email": "test@example.com",
        "password": "SecurePass123!",
        "name": "테스트 사용자",
    }


@pytest.fixture
def valid_user_with_shop_data() -> dict[str, Any]:
    """매장 정보를 포함한 유효한 사용자 데이터"""
    return {
        "email": "salon@example.com",
        "password": "SecurePass123!",
        "name": "살롱 오너",
        "shopName": "예쁜 네일샵",
        "shopType": "nail",
    }
