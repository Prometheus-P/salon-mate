"""
OAuth 서비스
Google/Kakao OAuth 인증 처리 로직
"""

import secrets
from typing import Literal
from urllib.parse import urlencode

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config.settings import get_settings
from core.security import create_tokens
from models.social_account import SocialAccount
from models.user import User
from schemas.auth import AuthResponse, UserResponse

settings = get_settings()

SUPPORTED_PROVIDERS = ["google", "kakao"]

OAuthProvider = Literal["google", "kakao"]


class OAuthException(Exception):
    """OAuth 관련 예외"""

    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class OAuthService:
    """OAuth 서비스"""

    def __init__(self, db: AsyncSession):
        self.db = db

    def get_oauth_url(self, provider: OAuthProvider, redirect_uri: str) -> str:
        """OAuth 인증 URL을 생성합니다."""
        state = secrets.token_urlsafe(32)

        if provider == "google":
            return self._get_google_oauth_url(redirect_uri, state)
        elif provider == "kakao":
            return self._get_kakao_oauth_url(redirect_uri, state)
        else:
            raise OAuthException(f"지원하지 않는 프로바이더입니다: {provider}", 404)

    def _get_google_oauth_url(self, redirect_uri: str, state: str) -> str:
        """Google OAuth URL을 생성합니다."""
        params = {
            "client_id": settings.google_client_id or "mock-google-client-id",
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "offline",
            "prompt": "consent",
        }
        return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"

    def _get_kakao_oauth_url(self, redirect_uri: str, state: str) -> str:
        """Kakao OAuth URL을 생성합니다."""
        params = {
            "client_id": settings.kakao_client_id or "mock-kakao-client-id",
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "state": state,
        }
        return f"https://kauth.kakao.com/oauth/authorize?{urlencode(params)}"

    async def get_google_user_info(
        self, code: str, redirect_uri: str
    ) -> dict[str, str]:
        """Google에서 사용자 정보를 가져옵니다."""
        # 토큰 교환
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                },
            )

            if token_response.status_code != 200:
                raise OAuthException("Google 인증 코드가 유효하지 않습니다.", 400)

            token_data = token_response.json()
            access_token = token_data.get("access_token")

            # 사용자 정보 조회
            user_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )

            if user_response.status_code != 200:
                raise OAuthException("Google 사용자 정보를 가져올 수 없습니다.", 400)

            user_data = user_response.json()
            return {
                "id": user_data["id"],
                "email": user_data["email"],
                "name": user_data.get("name", user_data["email"].split("@")[0]),
                "picture": user_data.get("picture"),
            }

    async def get_kakao_user_info(self, code: str, redirect_uri: str) -> dict[str, str]:
        """Kakao에서 사용자 정보를 가져옵니다."""
        async with httpx.AsyncClient() as client:
            # 토큰 교환
            token_response = await client.post(
                "https://kauth.kakao.com/oauth/token",
                data={
                    "grant_type": "authorization_code",
                    "client_id": settings.kakao_client_id,
                    "client_secret": settings.kakao_client_secret,
                    "redirect_uri": redirect_uri,
                    "code": code,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

            if token_response.status_code != 200:
                raise OAuthException("Kakao 인증 코드가 유효하지 않습니다.", 400)

            token_data = token_response.json()
            access_token = token_data.get("access_token")

            # 사용자 정보 조회
            user_response = await client.get(
                "https://kapi.kakao.com/v2/user/me",
                headers={"Authorization": f"Bearer {access_token}"},
            )

            if user_response.status_code != 200:
                raise OAuthException("Kakao 사용자 정보를 가져올 수 없습니다.", 400)

            user_data = user_response.json()
            kakao_account = user_data.get("kakao_account", {})
            profile = kakao_account.get("profile", {})

            return {
                "id": str(user_data["id"]),
                "email": kakao_account.get("email", f"{user_data['id']}@kakao.user"),
                "name": profile.get("nickname", f"User{user_data['id']}"),
                "picture": profile.get("profile_image_url"),
            }

    async def handle_oauth_callback(
        self, provider: OAuthProvider, user_info: dict[str, str]
    ) -> AuthResponse:
        """OAuth 콜백을 처리하고 사용자를 생성하거나 로그인합니다."""
        provider_user_id = user_info["id"]
        email = user_info["email"]
        name = user_info["name"]
        picture = user_info.get("picture")

        # 기존 소셜 계정 확인
        social_account = await self._get_social_account(provider, provider_user_id)

        if social_account:
            # 기존 소셜 계정으로 로그인
            user = social_account.user
        else:
            # 이메일로 기존 사용자 확인
            user = await self._get_user_by_email(email)

            if user:
                # 기존 사용자에 소셜 계정 연동
                social_account = SocialAccount(
                    user_id=user.id,
                    provider=provider,
                    provider_user_id=provider_user_id,
                )
                self.db.add(social_account)
                await self.db.commit()
            else:
                # 새 사용자 생성
                user = User(
                    email=email,
                    name=name,
                    avatar_url=picture,
                    auth_provider=provider,
                )
                self.db.add(user)
                await self.db.commit()
                await self.db.refresh(user)

                # 소셜 계정 생성
                social_account = SocialAccount(
                    user_id=user.id,
                    provider=provider,
                    provider_user_id=provider_user_id,
                )
                self.db.add(social_account)
                await self.db.commit()

        # 토큰 생성
        access_token, refresh_token, expires_in = create_tokens(str(user.id))

        return AuthResponse(
            user=UserResponse(
                id=user.id,
                email=user.email,
                name=user.name,
                createdAt=user.created_at,
            ),
            accessToken=access_token,
            refreshToken=refresh_token,
            expiresIn=expires_in,
        )

    async def _get_social_account(
        self, provider: str, provider_user_id: str
    ) -> SocialAccount | None:
        """소셜 계정을 조회합니다."""
        result = await self.db.execute(
            select(SocialAccount)
            .where(SocialAccount.provider == provider)
            .where(SocialAccount.provider_user_id == provider_user_id)
        )
        return result.scalar_one_or_none()

    async def _get_user_by_email(self, email: str) -> User | None:
        """이메일로 사용자를 조회합니다."""
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()
