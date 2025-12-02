"""
사용자 엔드포인트
프로필 조회/수정, 비밀번호 변경 등
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db
from models.user import User
from schemas.user import (
    ChangePasswordRequest,
    MessageResponse,
    UserProfileResponse,
    UserProfileUpdate,
)
from services.auth_service import AuthException, AuthService
from services.user_service import UserException, UserService

router = APIRouter()
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """현재 인증된 사용자를 반환합니다."""
    auth_service = AuthService(db)
    try:
        return await auth_service.get_current_user(credentials.credentials)
    except AuthException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message) from e


def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    """사용자 서비스 의존성"""
    return UserService(db)


@router.get(
    "/me",
    response_model=UserProfileResponse,
    summary="내 프로필 조회",
)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
) -> UserProfileResponse:
    """현재 로그인한 사용자의 프로필을 조회합니다."""
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        avatarUrl=current_user.avatar_url,
        authProvider=current_user.auth_provider,
        createdAt=current_user.created_at,
    )


@router.patch(
    "/me",
    response_model=UserProfileResponse,
    summary="내 프로필 수정",
)
async def update_my_profile(
    update_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
) -> UserProfileResponse:
    """현재 로그인한 사용자의 프로필을 수정합니다.

    - **name**: 사용자 이름 (2-100자)
    - **avatarUrl**: 프로필 이미지 URL
    """
    try:
        updated_user = await user_service.update_profile(current_user, update_data)
        return UserProfileResponse(
            id=updated_user.id,
            email=updated_user.email,
            name=updated_user.name,
            avatarUrl=updated_user.avatar_url,
            authProvider=updated_user.auth_provider,
            createdAt=updated_user.created_at,
        )
    except UserException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message) from e


@router.post(
    "/me/password",
    response_model=MessageResponse,
    summary="비밀번호 변경",
)
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
) -> MessageResponse:
    """비밀번호를 변경합니다.

    - **currentPassword**: 현재 비밀번호
    - **newPassword**: 새 비밀번호 (최소 8자)
    """
    try:
        await user_service.change_password(
            current_user,
            request.current_password,
            request.new_password,
        )
        return MessageResponse(message="비밀번호가 변경되었습니다.")
    except UserException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message) from e
