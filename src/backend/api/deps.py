"""
API 의존성
인증, 데이터베이스 세션 등 공통 의존성 정의
"""

from typing import Annotated, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db

# HTTP Bearer 토큰 스키마
security = HTTPBearer()

# 데이터베이스 세션 의존성
DBSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: DBSession,
) -> dict[str, Any]:
    """현재 인증된 사용자를 반환합니다."""
    # TODO: JWT 토큰 검증 및 사용자 조회 (Sprint 2에서 구현 예정)
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="인증 기능은 아직 구현되지 않았습니다.",
    )


# 현재 사용자 의존성
CurrentUser = Annotated[dict[str, Any], Depends(get_current_user)]
