"""
인증 엔드포인트
회원가입, 로그인, 토큰 갱신 등
"""

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db
from schemas.auth import (
    UserCreate,
    UserLogin,
    AuthResponse,
    RefreshTokenRequest,
    AccessTokenResponse,
)
from services.auth_service import AuthService, AuthException

router = APIRouter()


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    """인증 서비스 의존성"""
    return AuthService(db)


@router.post(
    "/signup",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="이메일 회원가입",
)
async def signup(
    user_data: UserCreate,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    """
    이메일과 비밀번호로 새 사용자를 등록합니다.

    - **email**: 유효한 이메일 주소 (unique)
    - **password**: 최소 8자 이상의 비밀번호
    - **name**: 사용자 이름 (2-100자)
    - **shopName**: 매장 이름 (선택)
    - **shopType**: 매장 유형 (nail, hair, skin, lash) (선택)
    """
    try:
        return await auth_service.signup(user_data)
    except AuthException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="이메일 로그인",
)
async def login(
    credentials: UserLogin,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    """
    이메일과 비밀번호로 로그인합니다.

    성공 시 액세스 토큰과 리프레시 토큰을 반환합니다.
    """
    try:
        return await auth_service.login(credentials)
    except AuthException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post(
    "/refresh",
    response_model=AccessTokenResponse,
    summary="토큰 갱신",
)
async def refresh_token(
    request: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> AccessTokenResponse:
    """
    리프레시 토큰으로 새 액세스 토큰을 발급받습니다.
    """
    try:
        return await auth_service.refresh_token(request.refresh_token)
    except AuthException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post(
    "/logout",
    response_model=dict,
    summary="로그아웃",
)
async def logout() -> dict:
    """
    현재 세션을 종료합니다.

    클라이언트 측에서 저장된 토큰을 삭제해야 합니다.
    서버 측에서는 stateless JWT를 사용하므로 별도 처리가 필요 없습니다.
    """
    return {"message": "로그아웃되었습니다."}
