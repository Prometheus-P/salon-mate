"""
인증 엔드포인트
회원가입, 로그인, 토큰 갱신 등
"""

from fastapi import APIRouter, HTTPException, status

from schemas.auth import (
    UserCreate,
    UserLogin,
    AuthResponse,
    RefreshTokenRequest,
    AccessTokenResponse,
)

router = APIRouter()


@router.post(
    "/signup",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="이메일 회원가입",
)
async def signup(user_data: UserCreate) -> dict:
    """
    이메일과 비밀번호로 새 사용자를 등록합니다.

    - **email**: 유효한 이메일 주소 (unique)
    - **password**: 최소 8자 이상의 비밀번호
    - **name**: 사용자 이름 (2-100자)
    - **shopName**: 매장 이름 (선택)
    - **shopType**: 매장 유형 (nail, hair, skin, lash) (선택)
    """
    # TODO: 실제 구현 (Sprint 2에서 구현 예정)
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="회원가입 기능은 아직 구현되지 않았습니다.",
    )


@router.post(
    "/login",
    response_model=dict,
    summary="이메일 로그인",
)
async def login(credentials: UserLogin) -> dict:
    """
    이메일과 비밀번호로 로그인합니다.

    성공 시 액세스 토큰과 리프레시 토큰을 반환합니다.
    """
    # TODO: 실제 구현 (Sprint 2에서 구현 예정)
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="로그인 기능은 아직 구현되지 않았습니다.",
    )


@router.post(
    "/refresh",
    response_model=dict,
    summary="토큰 갱신",
)
async def refresh_token(request: RefreshTokenRequest) -> dict:
    """
    리프레시 토큰으로 새 액세스 토큰을 발급받습니다.
    """
    # TODO: 실제 구현 (Sprint 2에서 구현 예정)
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="토큰 갱신 기능은 아직 구현되지 않았습니다.",
    )


@router.post(
    "/logout",
    response_model=dict,
    summary="로그아웃",
)
async def logout() -> dict:
    """
    현재 세션을 종료합니다.
    """
    # TODO: 실제 구현 (Sprint 2에서 구현 예정)
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="로그아웃 기능은 아직 구현되지 않았습니다.",
    )
