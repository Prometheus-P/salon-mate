"""
인증 엔드포인트
회원가입, 로그인, 토큰 갱신, OAuth 등
"""

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db
from config.settings import get_settings
from schemas.auth import (
    AccessTokenResponse,
    AuthResponse,
    RefreshTokenRequest,
    UserCreate,
    UserLogin,
)
from schemas.oauth import OAuthCallbackRequest, OAuthProvidersResponse, OAuthURLResponse
from services.auth_service import AuthException, AuthService
from services.oauth_service import SUPPORTED_PROVIDERS, OAuthException, OAuthService

router = APIRouter()
settings = get_settings()


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    """인증 서비스 의존성"""
    return AuthService(db)


def get_oauth_service(db: AsyncSession = Depends(get_db)) -> OAuthService:
    """OAuth 서비스 의존성"""
    return OAuthService(db)


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


# ============ OAuth 엔드포인트 ============


@router.get(
    "/oauth/providers",
    response_model=OAuthProvidersResponse,
    summary="지원 OAuth 프로바이더 목록",
)
async def get_oauth_providers() -> OAuthProvidersResponse:
    """지원되는 OAuth 프로바이더 목록을 반환합니다."""
    return OAuthProvidersResponse(providers=SUPPORTED_PROVIDERS)


@router.get(
    "/oauth/{provider}",
    response_model=OAuthURLResponse,
    summary="OAuth 인증 URL 조회",
)
async def get_oauth_url(
    provider: Literal["google", "kakao"],
    oauth_service: OAuthService = Depends(get_oauth_service),
) -> OAuthURLResponse:
    """
    OAuth 프로바이더의 인증 URL을 반환합니다.

    - **provider**: google 또는 kakao
    """
    if provider not in SUPPORTED_PROVIDERS:
        raise HTTPException(status_code=404, detail=f"지원하지 않는 프로바이더입니다: {provider}")

    redirect_uri = f"{settings.oauth_redirect_base_url}/{provider}"
    auth_url = oauth_service.get_oauth_url(provider, redirect_uri)

    return OAuthURLResponse(authUrl=auth_url)


@router.post(
    "/oauth/{provider}/callback",
    response_model=AuthResponse,
    summary="OAuth 콜백 처리",
)
async def oauth_callback(
    provider: Literal["google", "kakao"],
    callback_data: OAuthCallbackRequest,
    oauth_service: OAuthService = Depends(get_oauth_service),
) -> AuthResponse:
    """
    OAuth 콜백을 처리하고 로그인/회원가입을 수행합니다.

    - **provider**: google 또는 kakao
    - **code**: OAuth 인증 코드
    - **state**: CSRF 방지용 state 값
    """
    if provider not in SUPPORTED_PROVIDERS:
        raise HTTPException(status_code=404, detail=f"지원하지 않는 프로바이더입니다: {provider}")

    try:
        redirect_uri = f"{settings.oauth_redirect_base_url}/{provider}"

        # 프로바이더별 사용자 정보 조회
        if provider == "google":
            user_info = await oauth_service.get_google_user_info(
                callback_data.code, redirect_uri
            )
        elif provider == "kakao":
            user_info = await oauth_service.get_kakao_user_info(
                callback_data.code, redirect_uri
            )
        else:
            raise HTTPException(status_code=404, detail="지원하지 않는 프로바이더입니다.")

        # OAuth 콜백 처리 (사용자 생성/로그인)
        return await oauth_service.handle_oauth_callback(provider, user_info)

    except OAuthException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth 인증 중 오류가 발생했습니다: {str(e)}")
