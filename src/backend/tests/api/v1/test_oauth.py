"""
OAuth 인증 테스트
Google/Kakao OAuth 공통 로직 및 콜백 핸들러 테스트
"""

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from models.user import User


class TestOAuthProviderURL:
    """OAuth 인증 URL 생성 테스트"""

    @pytest.mark.asyncio
    async def test_should_return_google_oauth_url(self, client: AsyncClient):
        """Google OAuth 인증 URL을 반환해야 함"""
        response = await client.get("/v1/auth/oauth/google")

        assert response.status_code == 200
        data = response.json()
        assert "authUrl" in data
        assert "accounts.google.com" in data["authUrl"]
        assert "client_id" in data["authUrl"]
        assert "redirect_uri" in data["authUrl"]

    @pytest.mark.asyncio
    async def test_should_return_kakao_oauth_url(self, client: AsyncClient):
        """Kakao OAuth 인증 URL을 반환해야 함"""
        response = await client.get("/v1/auth/oauth/kakao")

        assert response.status_code == 200
        data = response.json()
        assert "authUrl" in data
        assert "kauth.kakao.com" in data["authUrl"]
        assert "client_id" in data["authUrl"]
        assert "redirect_uri" in data["authUrl"]

    @pytest.mark.asyncio
    async def test_should_include_state_parameter(self, client: AsyncClient):
        """OAuth URL에 state 파라미터가 포함되어야 함 (CSRF 방지)"""
        response = await client.get("/v1/auth/oauth/google")

        assert response.status_code == 200
        data = response.json()
        assert "state" in data["authUrl"]


class TestOAuthCallback:
    """OAuth 콜백 처리 테스트"""

    @pytest.mark.asyncio
    async def test_should_create_new_user_on_first_google_login(
        self, client: AsyncClient, db_session
    ):
        """첫 Google 로그인 시 새 사용자를 생성해야 함"""
        mock_user_info = {
            "id": "google-123456",
            "email": "newuser@gmail.com",
            "name": "New User",
            "picture": "https://example.com/avatar.jpg",
        }

        with patch(
            "services.oauth_service.OAuthService.get_google_user_info",
            new_callable=AsyncMock,
            return_value=mock_user_info,
        ):
            response = await client.post(
                "/v1/auth/oauth/google/callback",
                json={"code": "valid-auth-code", "state": "valid-state"},
            )

        assert response.status_code == 200
        data = response.json()
        assert "accessToken" in data
        assert "refreshToken" in data
        assert data["user"]["email"] == "newuser@gmail.com"
        assert data["user"]["name"] == "New User"

    @pytest.mark.asyncio
    async def test_should_login_existing_user_on_google_oauth(
        self, client: AsyncClient, db_session
    ):
        """기존 사용자가 Google 로그인 시 로그인 처리해야 함"""
        # 기존 사용자 생성
        existing_user = User(
            email="existing@gmail.com",
            name="Existing User",
            auth_provider="google",
        )
        db_session.add(existing_user)
        await db_session.commit()
        await db_session.refresh(existing_user)

        mock_user_info = {
            "id": "google-existing-123",
            "email": "existing@gmail.com",
            "name": "Existing User",
            "picture": "https://example.com/avatar.jpg",
        }

        with patch(
            "services.oauth_service.OAuthService.get_google_user_info",
            new_callable=AsyncMock,
            return_value=mock_user_info,
        ):
            response = await client.post(
                "/v1/auth/oauth/google/callback",
                json={"code": "valid-auth-code", "state": "valid-state"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["user"]["email"] == "existing@gmail.com"

    @pytest.mark.asyncio
    async def test_should_return_error_on_invalid_oauth_code(self, client: AsyncClient):
        """유효하지 않은 OAuth 코드로 에러를 반환해야 함"""
        with patch(
            "services.oauth_service.OAuthService.get_google_user_info",
            new_callable=AsyncMock,
            side_effect=Exception("Invalid authorization code"),
        ):
            response = await client.post(
                "/v1/auth/oauth/google/callback",
                json={"code": "invalid-code", "state": "valid-state"},
            )

        assert response.status_code == 400
        detail = response.json()["detail"].lower()
        assert "오류" in detail or "error" in detail or "invalid" in detail

    @pytest.mark.asyncio
    async def test_should_create_new_user_on_first_kakao_login(
        self, client: AsyncClient, db_session
    ):
        """첫 Kakao 로그인 시 새 사용자를 생성해야 함"""
        mock_user_info = {
            "id": "kakao-789012",
            "email": "kakaouser@kakao.com",
            "name": "Kakao User",
            "picture": "https://kakao.com/avatar.jpg",
        }

        with patch(
            "services.oauth_service.OAuthService.get_kakao_user_info",
            new_callable=AsyncMock,
            return_value=mock_user_info,
        ):
            response = await client.post(
                "/v1/auth/oauth/kakao/callback",
                json={"code": "valid-auth-code", "state": "valid-state"},
            )

        assert response.status_code == 200
        data = response.json()
        assert "accessToken" in data
        assert data["user"]["email"] == "kakaouser@kakao.com"

    @pytest.mark.asyncio
    async def test_should_link_social_account_to_existing_email_user(
        self, client: AsyncClient, db_session
    ):
        """이메일로 가입한 기존 사용자가 같은 이메일로 소셜 로그인 시 계정을 연동해야 함"""
        # 이메일로 가입한 기존 사용자
        from core.security import hash_password

        existing_user = User(
            email="user@example.com",
            name="Email User",
            password_hash=hash_password("password123"),
            auth_provider="email",
        )
        db_session.add(existing_user)
        await db_session.commit()
        await db_session.refresh(existing_user)

        mock_user_info = {
            "id": "google-new-456",
            "email": "user@example.com",
            "name": "Email User",
            "picture": "https://example.com/avatar.jpg",
        }

        with patch(
            "services.oauth_service.OAuthService.get_google_user_info",
            new_callable=AsyncMock,
            return_value=mock_user_info,
        ):
            response = await client.post(
                "/v1/auth/oauth/google/callback",
                json={"code": "valid-auth-code", "state": "valid-state"},
            )

        assert response.status_code == 200
        data = response.json()
        # 기존 사용자 ID와 동일해야 함
        assert data["user"]["id"] == str(existing_user.id)


class TestSocialAccountModel:
    """소셜 계정 모델 테스트"""

    @pytest.mark.asyncio
    async def test_should_store_social_account_info(
        self, client: AsyncClient, db_session
    ):
        """소셜 계정 정보가 저장되어야 함"""
        from sqlalchemy import select

        from models.social_account import SocialAccount

        mock_user_info = {
            "id": "google-store-test",
            "email": "storetest@gmail.com",
            "name": "Store Test User",
            "picture": "https://example.com/avatar.jpg",
        }

        with patch(
            "services.oauth_service.OAuthService.get_google_user_info",
            new_callable=AsyncMock,
            return_value=mock_user_info,
        ):
            response = await client.post(
                "/v1/auth/oauth/google/callback",
                json={"code": "valid-auth-code", "state": "valid-state"},
            )

        assert response.status_code == 200

        # 소셜 계정 정보가 저장되었는지 확인
        result = await db_session.execute(
            select(SocialAccount).where(
                SocialAccount.provider_user_id == "google-store-test"
            )
        )
        social_account = result.scalar_one_or_none()

        assert social_account is not None
        assert social_account.provider == "google"
        assert social_account.provider_user_id == "google-store-test"


class TestOAuthSupportedProviders:
    """지원되는 OAuth 프로바이더 테스트"""

    @pytest.mark.asyncio
    async def test_should_return_422_for_unsupported_provider(
        self, client: AsyncClient
    ):
        """지원하지 않는 프로바이더에 대해 422를 반환해야 함 (Literal 타입 검증)"""
        response = await client.get("/v1/auth/oauth/facebook")
        # FastAPI의 Literal["google", "kakao"] 타입 검증으로 422 반환
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_should_list_supported_providers(self, client: AsyncClient):
        """지원되는 프로바이더 목록을 반환해야 함"""
        response = await client.get("/v1/auth/oauth/providers")

        assert response.status_code == 200
        data = response.json()
        assert "providers" in data
        assert "google" in data["providers"]
        assert "kakao" in data["providers"]
