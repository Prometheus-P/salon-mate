"""
API 의존성
인증, 데이터베이스 세션 등 공통 의존성 정의
"""

from typing import Annotated

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db
from models.user import User
from services.auth_service import AuthException, AuthService

# HTTP Bearer 토큰 스키마
security = HTTPBearer()

# 데이터베이스 세션 의존성
DBSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: DBSession,
) -> User:
    """현재 인증된 사용자를 반환합니다."""
    auth_service = AuthService(db)
    try:
        return await auth_service.get_current_user(credentials.credentials)
    except AuthException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message) from e


# 현재 사용자 의존성
CurrentUser = Annotated[User, Depends(get_current_user)]
