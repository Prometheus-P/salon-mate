"""
Instagram Graph API 서비스
Instagram Business 계정을 통한 콘텐츠 발행 기능
"""

from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config.settings import get_settings
from models.shop import Shop
from models.social_account import SocialAccount

settings = get_settings()


class InstagramAPIError(Exception):
    """Instagram API 관련 예외"""

    def __init__(
        self, message: str, status_code: int = 400, error_code: str | None = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(self.message)


class InstagramService:
    """Instagram Graph API 서비스

    Instagram Graph API를 사용하여 Business/Creator 계정에 콘텐츠를 발행합니다.

    API 흐름:
    1. Facebook OAuth로 사용자 인증
    2. Instagram Business 계정 ID 조회
    3. 미디어 컨테이너 생성 (이미지 URL + 캡션)
    4. 컨테이너 발행

    참고: https://developers.facebook.com/docs/instagram-api/guides/content-publishing
    """

    BASE_URL = "https://graph.facebook.com/v21.0"

    def __init__(self, db: AsyncSession):
        self.db = db
        self.client = httpx.AsyncClient(timeout=30.0)

    async def close(self):
        """HTTP 클라이언트 종료"""
        await self.client.aclose()

    # ============== OAuth 관련 ==============

    def get_oauth_url(self, state: str, redirect_uri: str) -> str:
        """Facebook OAuth 인증 URL 생성

        Instagram Graph API는 Facebook Login을 통해 인증합니다.
        필요 권한: instagram_basic, instagram_content_publish, pages_show_list, pages_read_engagement
        """
        scopes = [
            "instagram_basic",
            "instagram_content_publish",
            "pages_show_list",
            "pages_read_engagement",
            "business_management",
        ]

        return (
            f"https://www.facebook.com/v21.0/dialog/oauth?"
            f"client_id={settings.instagram_app_id}"
            f"&redirect_uri={redirect_uri}"
            f"&state={state}"
            f"&scope={','.join(scopes)}"
        )

    async def exchange_code_for_token(
        self, code: str, redirect_uri: str
    ) -> dict[str, Any]:
        """Authorization code를 access token으로 교환

        Returns:
            dict: {
                "access_token": "...",
                "token_type": "bearer",
                "expires_in": 5183944
            }
        """
        response = await self.client.get(
            f"{self.BASE_URL}/oauth/access_token",
            params={
                "client_id": settings.instagram_app_id,
                "client_secret": settings.instagram_app_secret,
                "redirect_uri": redirect_uri,
                "code": code,
            },
        )

        data = response.json()

        if "error" in data:
            raise InstagramAPIError(
                message=data.get("error", {}).get("message", "OAuth failed"),
                error_code=data.get("error", {}).get("code"),
            )

        return data

    async def exchange_for_long_lived_token(
        self, short_lived_token: str
    ) -> dict[str, Any]:
        """단기 토큰을 장기 토큰(60일)으로 교환

        Returns:
            dict: {
                "access_token": "...",
                "token_type": "bearer",
                "expires_in": 5183944  # ~60 days in seconds
            }
        """
        response = await self.client.get(
            f"{self.BASE_URL}/oauth/access_token",
            params={
                "grant_type": "fb_exchange_token",
                "client_id": settings.instagram_app_id,
                "client_secret": settings.instagram_app_secret,
                "fb_exchange_token": short_lived_token,
            },
        )

        data = response.json()

        if "error" in data:
            raise InstagramAPIError(
                message=data.get("error", {}).get("message", "Token exchange failed"),
                error_code=data.get("error", {}).get("code"),
            )

        return data

    # ============== 계정 조회 ==============

    async def get_instagram_business_account(
        self, access_token: str
    ) -> dict[str, Any] | None:
        """연결된 Instagram Business 계정 조회

        Facebook Page에 연결된 Instagram Business 계정을 찾습니다.

        Returns:
            dict: {
                "id": "instagram_business_account_id",
                "username": "account_username",
                "name": "Account Name"
            }
        """
        # 1. 사용자의 Facebook Pages 조회
        pages_response = await self.client.get(
            f"{self.BASE_URL}/me/accounts",
            params={"access_token": access_token},
        )

        pages_data = pages_response.json()

        if "error" in pages_data:
            raise InstagramAPIError(
                message=pages_data.get("error", {}).get(
                    "message", "Failed to get pages"
                ),
                error_code=pages_data.get("error", {}).get("code"),
            )

        # 2. 각 Page에서 Instagram Business 계정 찾기
        for page in pages_data.get("data", []):
            page_id = page["id"]
            page_token = page["access_token"]

            ig_response = await self.client.get(
                f"{self.BASE_URL}/{page_id}",
                params={
                    "fields": "instagram_business_account{id,username,name,profile_picture_url}",
                    "access_token": page_token,
                },
            )

            ig_data = ig_response.json()

            if "instagram_business_account" in ig_data:
                ig_account = ig_data["instagram_business_account"]
                ig_account["page_id"] = page_id
                ig_account["page_access_token"] = page_token
                return ig_account

        return None

    # ============== 콘텐츠 발행 ==============

    async def create_media_container(
        self,
        ig_user_id: str,
        access_token: str,
        image_url: str,
        caption: str,
    ) -> str:
        """미디어 컨테이너 생성 (Step 1)

        Args:
            ig_user_id: Instagram Business 계정 ID
            access_token: Page Access Token
            image_url: 공개적으로 접근 가능한 이미지 URL (HTTPS 필수)
            caption: 포스트 캡션 (해시태그 포함)

        Returns:
            str: creation_id (컨테이너 ID)
        """
        response = await self.client.post(
            f"{self.BASE_URL}/{ig_user_id}/media",
            data={
                "image_url": image_url,
                "caption": caption,
                "access_token": access_token,
            },
        )

        data = response.json()

        if "error" in data:
            error = data.get("error", {})
            raise InstagramAPIError(
                message=error.get("message", "Failed to create media container"),
                status_code=error.get("code", 400),
                error_code=str(error.get("code")),
            )

        return data["id"]

    async def publish_media(
        self,
        ig_user_id: str,
        access_token: str,
        creation_id: str,
    ) -> str:
        """미디어 컨테이너 발행 (Step 2)

        Args:
            ig_user_id: Instagram Business 계정 ID
            access_token: Page Access Token
            creation_id: create_media_container에서 받은 ID

        Returns:
            str: Instagram 미디어 ID (게시된 포스트 ID)
        """
        response = await self.client.post(
            f"{self.BASE_URL}/{ig_user_id}/media_publish",
            data={
                "creation_id": creation_id,
                "access_token": access_token,
            },
        )

        data = response.json()

        if "error" in data:
            error = data.get("error", {})
            raise InstagramAPIError(
                message=error.get("message", "Failed to publish media"),
                status_code=error.get("code", 400),
                error_code=str(error.get("code")),
            )

        return data["id"]

    async def publish_post(
        self,
        ig_user_id: str,
        access_token: str,
        image_url: str,
        caption: str,
    ) -> str:
        """이미지 포스트 발행 (원스텝)

        컨테이너 생성 + 발행을 한 번에 처리합니다.

        Args:
            ig_user_id: Instagram Business 계정 ID
            access_token: Page Access Token
            image_url: 공개 이미지 URL
            caption: 캡션 (해시태그 포함)

        Returns:
            str: Instagram 미디어 ID
        """
        # Step 1: 컨테이너 생성
        creation_id = await self.create_media_container(
            ig_user_id=ig_user_id,
            access_token=access_token,
            image_url=image_url,
            caption=caption,
        )

        # Step 2: 발행
        media_id = await self.publish_media(
            ig_user_id=ig_user_id,
            access_token=access_token,
            creation_id=creation_id,
        )

        return media_id

    # ============== 인사이트 조회 ==============

    async def get_media_insights(
        self,
        media_id: str,
        access_token: str,
    ) -> dict[str, Any]:
        """미디어 인사이트 조회

        Returns:
            dict: {
                "impressions": int,
                "reach": int,
                "engagement": int,
                "saved": int,
                "likes": int,
                "comments": int,
                "shares": int
            }
        """
        metrics = [
            "impressions",
            "reach",
            "engagement",
            "saved",
            "likes",
            "comments",
            "shares",
        ]

        response = await self.client.get(
            f"{self.BASE_URL}/{media_id}/insights",
            params={
                "metric": ",".join(metrics),
                "access_token": access_token,
            },
        )

        data = response.json()

        if "error" in data:
            # 인사이트 조회 실패는 치명적이지 않음
            return {}

        result = {}
        for item in data.get("data", []):
            result[item["name"]] = item["values"][0]["value"]

        return result

    # ============== Shop 연동 헬퍼 ==============

    async def get_shop_instagram_account(
        self, shop_id: UUID
    ) -> tuple[SocialAccount, dict[str, Any]] | None:
        """Shop에 연결된 Instagram 계정 조회

        Returns:
            tuple: (SocialAccount, {"ig_user_id": ..., "page_access_token": ...})
            None if not connected
        """
        # Shop의 user_id로 Instagram SocialAccount 조회
        result = await self.db.execute(
            select(SocialAccount, Shop)
            .join(Shop, Shop.user_id == SocialAccount.user_id)
            .where(Shop.id == shop_id)
            .where(SocialAccount.provider == "instagram")
        )

        row = result.first()
        if not row:
            return None

        social_account, shop = row

        # 토큰 만료 확인
        if (
            social_account.token_expires_at
            and social_account.token_expires_at < datetime.now(UTC)
        ):
            raise InstagramAPIError(
                message="Instagram 토큰이 만료되었습니다. 다시 연결해주세요.",
                status_code=401,
            )

        # Instagram Business 계정 정보는 SocialAccount.provider_user_id에 저장
        # Page Access Token은 access_token에 저장
        return social_account, {
            "ig_user_id": social_account.provider_user_id,
            "page_access_token": social_account.access_token,
        }

    async def save_instagram_connection(
        self,
        user_id: UUID,
        ig_account_id: str,
        page_access_token: str,
        token_expires_in: int,
    ) -> SocialAccount:
        """Instagram 연결 정보 저장

        Args:
            user_id: 사용자 ID
            ig_account_id: Instagram Business 계정 ID
            page_access_token: Facebook Page Access Token (장기 토큰)
            token_expires_in: 토큰 만료 시간 (초)
        """
        expires_at = datetime.now(UTC) + timedelta(seconds=token_expires_in)

        # 기존 연결 확인
        result = await self.db.execute(
            select(SocialAccount).where(
                SocialAccount.user_id == user_id,
                SocialAccount.provider == "instagram",
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            existing.provider_user_id = ig_account_id
            existing.access_token = page_access_token
            existing.token_expires_at = expires_at
            await self.db.commit()
            await self.db.refresh(existing)
            return existing

        # 새 연결 생성
        social_account = SocialAccount(
            user_id=user_id,
            provider="instagram",
            provider_user_id=ig_account_id,
            access_token=page_access_token,
            token_expires_at=expires_at,
        )

        self.db.add(social_account)
        await self.db.commit()
        await self.db.refresh(social_account)

        return social_account
