"""
Instagram 연동 API 엔드포인트
Instagram Business 계정 OAuth 및 연결 관리
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_db
from config.settings import get_settings
from models.user import User
from services.instagram_service import InstagramAPIError, InstagramService

router = APIRouter()
settings = get_settings()


class InstagramConnectionStatus(BaseModel):
    """Instagram 연결 상태 응답"""

    connected: bool
    username: str | None = None
    profile_picture_url: str | None = None
    expires_at: str | None = None


class InstagramOAuthStart(BaseModel):
    """OAuth 시작 응답"""

    oauth_url: str


class InstagramOAuthCallback(BaseModel):
    """OAuth 콜백 처리 결과"""

    success: bool
    username: str | None = None
    message: str


# ============== OAuth 흐름 ==============


@router.get("/oauth/start", response_model=InstagramOAuthStart)
async def start_instagram_oauth(
    current_user: Annotated[User, Depends(get_current_user)],
    redirect_uri: str = Query(..., description="OAuth 콜백 후 리다이렉트할 URI"),
) -> InstagramOAuthStart:
    """Instagram OAuth 인증 시작

    Facebook Login을 통해 Instagram Business 계정 권한을 요청합니다.
    반환된 oauth_url로 사용자를 리다이렉트하세요.
    """
    # state에 user_id와 redirect_uri를 인코딩 (실제로는 암호화된 세션 사용 권장)
    state = f"{current_user.id}|{redirect_uri}"

    # 실제 OAuth 콜백 URL (백엔드)
    backend_callback = f"{settings.oauth_redirect_base_url.rsplit('/auth', 1)[0]}/v1/instagram/oauth/callback"

    instagram_service = InstagramService.__new__(InstagramService)
    oauth_url = instagram_service.get_oauth_url(
        state=state,
        redirect_uri=backend_callback,
    )

    return InstagramOAuthStart(oauth_url=oauth_url)


@router.get("/oauth/callback")
async def instagram_oauth_callback(
    code: str = Query(..., description="Facebook OAuth authorization code"),
    state: str = Query(..., description="State parameter with user info"),
    db: AsyncSession = Depends(get_db),
) -> RedirectResponse:
    """Instagram OAuth 콜백 처리

    Facebook에서 리다이렉트된 요청을 처리하고,
    access token을 교환하여 Instagram 계정을 연결합니다.
    """
    instagram_service = InstagramService(db)

    try:
        # state에서 user_id와 redirect_uri 추출
        parts = state.split("|", 1)
        if len(parts) != 2:
            raise HTTPException(status_code=400, detail="Invalid state parameter")

        user_id = UUID(parts[0])
        frontend_redirect = parts[1]

        # 백엔드 콜백 URL
        backend_callback = f"{settings.oauth_redirect_base_url.rsplit('/auth', 1)[0]}/v1/instagram/oauth/callback"

        # 1. Authorization code를 access token으로 교환
        token_data = await instagram_service.exchange_code_for_token(
            code=code,
            redirect_uri=backend_callback,
        )

        short_token = token_data["access_token"]

        # 2. 장기 토큰으로 교환
        long_token_data = await instagram_service.exchange_for_long_lived_token(
            short_lived_token=short_token
        )

        long_token = long_token_data["access_token"]
        expires_in = long_token_data.get("expires_in", 5184000)  # 기본 60일

        # 3. Instagram Business 계정 조회
        ig_account = await instagram_service.get_instagram_business_account(long_token)

        if not ig_account:
            # Instagram Business 계정이 없으면 에러
            error_redirect = f"{frontend_redirect}?error=no_business_account"
            return RedirectResponse(url=error_redirect)

        # 4. 연결 정보 저장
        await instagram_service.save_instagram_connection(
            user_id=user_id,
            ig_account_id=ig_account["id"],
            page_access_token=ig_account["page_access_token"],
            token_expires_in=expires_in,
        )

        # 5. 프론트엔드로 리다이렉트
        success_redirect = f"{frontend_redirect}?success=true&username={ig_account.get('username', '')}"
        return RedirectResponse(url=success_redirect)

    except InstagramAPIError as e:
        error_redirect = f"{frontend_redirect}?error={e.message}"
        return RedirectResponse(url=error_redirect)

    except Exception:
        error_redirect = f"{frontend_redirect}?error=unknown_error"
        return RedirectResponse(url=error_redirect)

    finally:
        await instagram_service.close()


# ============== 연결 상태 관리 ==============


@router.get("/status", response_model=InstagramConnectionStatus)
async def get_instagram_connection_status(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
) -> InstagramConnectionStatus:
    """현재 사용자의 Instagram 연결 상태 조회"""
    from sqlalchemy import select

    from models.social_account import SocialAccount

    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.user_id == current_user.id,
            SocialAccount.provider == "instagram",
        )
    )
    social_account = result.scalar_one_or_none()

    if not social_account or not social_account.access_token:
        return InstagramConnectionStatus(connected=False)

    # Instagram 계정 정보 조회
    instagram_service = InstagramService(db)
    try:
        ig_account = await instagram_service.get_instagram_business_account(
            social_account.access_token
        )

        return InstagramConnectionStatus(
            connected=True,
            username=ig_account.get("username") if ig_account else None,
            profile_picture_url=ig_account.get("profile_picture_url")
            if ig_account
            else None,
            expires_at=social_account.token_expires_at.isoformat()
            if social_account.token_expires_at
            else None,
        )
    except InstagramAPIError:
        # 토큰이 유효하지 않으면 연결 해제 상태로 표시
        return InstagramConnectionStatus(connected=False)
    finally:
        await instagram_service.close()


@router.delete("/disconnect")
async def disconnect_instagram(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
) -> dict[str, bool]:
    """Instagram 계정 연결 해제"""
    from sqlalchemy import delete

    from models.social_account import SocialAccount

    await db.execute(
        delete(SocialAccount).where(
            SocialAccount.user_id == current_user.id,
            SocialAccount.provider == "instagram",
        )
    )
    await db.commit()

    return {"success": True}


# ============== Shop별 Instagram 상태 ==============


@router.get("/shop/{shop_id}/status", response_model=InstagramConnectionStatus)
async def get_shop_instagram_status(
    shop_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
) -> InstagramConnectionStatus:
    """특정 Shop의 Instagram 연결 상태 조회"""
    instagram_service = InstagramService(db)

    try:
        ig_connection = await instagram_service.get_shop_instagram_account(shop_id)

        if not ig_connection:
            return InstagramConnectionStatus(connected=False)

        social_account, ig_info = ig_connection

        if not social_account.access_token:
            return InstagramConnectionStatus(connected=False)

        # 계정 정보 조회
        ig_account = await instagram_service.get_instagram_business_account(
            social_account.access_token
        )

        return InstagramConnectionStatus(
            connected=True,
            username=ig_account.get("username") if ig_account else None,
            profile_picture_url=ig_account.get("profile_picture_url")
            if ig_account
            else None,
            expires_at=social_account.token_expires_at.isoformat()
            if social_account.token_expires_at
            else None,
        )

    except InstagramAPIError:
        return InstagramConnectionStatus(connected=False)

    finally:
        await instagram_service.close()
