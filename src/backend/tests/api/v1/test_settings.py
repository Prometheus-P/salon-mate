"""
설정 API 테스트
"""

import pytest
from httpx import AsyncClient

from core.security import create_tokens, hash_password
from models.user import User


@pytest.fixture
async def authenticated_user(db_session):
    """인증된 사용자 fixture"""
    user = User(
        email="settings@example.com",
        name="설정 테스트 사용자",
        password_hash=hash_password("password123"),
        auth_provider="email",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    access_token, _, _ = create_tokens(str(user.id))
    return {"user": user, "token": access_token}


class TestProfileSettings:
    """프로필 설정 테스트"""

    @pytest.mark.asyncio
    async def test_should_get_profile(
        self, client: AsyncClient, authenticated_user
    ):
        """프로필을 조회할 수 있어야 함"""
        response = await client.get(
            "/v1/settings/profile",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "settings@example.com"
        assert data["name"] == "설정 테스트 사용자"
        assert "id" in data

    @pytest.mark.asyncio
    async def test_should_update_profile_name(
        self, client: AsyncClient, authenticated_user
    ):
        """프로필 이름을 수정할 수 있어야 함"""
        response = await client.patch(
            "/v1/settings/profile",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
            json={"name": "수정된 이름"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "수정된 이름"

    @pytest.mark.asyncio
    async def test_should_return_401_without_auth(self, client: AsyncClient):
        """인증 없이 프로필 조회 시 401 반환"""
        response = await client.get("/v1/settings/profile")
        assert response.status_code == 401


class TestNotificationSettings:
    """알림 설정 테스트"""

    @pytest.mark.asyncio
    async def test_should_get_notification_settings(
        self, client: AsyncClient, authenticated_user
    ):
        """알림 설정을 조회할 수 있어야 함"""
        response = await client.get(
            "/v1/settings/notifications",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        # 알림 설정 필드 확인
        assert "channels" in data or "newReview" in data

    @pytest.mark.asyncio
    async def test_should_update_notification_settings(
        self, client: AsyncClient, authenticated_user
    ):
        """알림 설정을 수정할 수 있어야 함"""
        response = await client.patch(
            "/v1/settings/notifications",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
            json={"emailNotifications": False},
        )

        assert response.status_code == 200


class TestIntegrationSettings:
    """연동 설정 테스트"""

    @pytest.mark.asyncio
    async def test_should_get_integrations(
        self, client: AsyncClient, authenticated_user
    ):
        """연동 목록을 조회할 수 있어야 함"""
        response = await client.get(
            "/v1/settings/integrations",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    @pytest.mark.asyncio
    async def test_should_connect_google_integration(
        self, client: AsyncClient, authenticated_user
    ):
        """Google 연동을 추가할 수 있어야 함"""
        response = await client.post(
            "/v1/settings/integrations/google",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["platform"] == "google"

    @pytest.mark.asyncio
    async def test_should_connect_naver_integration(
        self, client: AsyncClient, authenticated_user
    ):
        """Naver 연동을 추가할 수 있어야 함"""
        response = await client.post(
            "/v1/settings/integrations/naver",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["platform"] == "naver"

    @pytest.mark.asyncio
    async def test_should_connect_instagram_integration(
        self, client: AsyncClient, authenticated_user
    ):
        """Instagram 연동을 추가할 수 있어야 함"""
        response = await client.post(
            "/v1/settings/integrations/instagram",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["platform"] == "instagram"


class TestSubscriptionSettings:
    """구독 설정 테스트"""

    @pytest.mark.asyncio
    async def test_should_get_subscription(
        self, client: AsyncClient, authenticated_user
    ):
        """구독 정보를 조회할 수 있어야 함"""
        response = await client.get(
            "/v1/settings/subscription",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "plan" in data

    @pytest.mark.asyncio
    async def test_should_get_payment_history(
        self, client: AsyncClient, authenticated_user
    ):
        """결제 내역을 조회할 수 있어야 함"""
        response = await client.get(
            "/v1/settings/subscription/history",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestTeamSettings:
    """팀 설정 테스트"""

    @pytest.mark.asyncio
    async def test_should_get_team_members(
        self, client: AsyncClient, authenticated_user
    ):
        """팀원 목록을 조회할 수 있어야 함"""
        response = await client.get(
            "/v1/settings/team",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    @pytest.mark.asyncio
    async def test_should_invite_team_member(
        self, client: AsyncClient, authenticated_user
    ):
        """팀원을 초대할 수 있어야 함"""
        response = await client.post(
            "/v1/settings/team/invite",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
            json={
                "email": "newmember@example.com",
                "role": "member",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "newmember@example.com"
        assert data["role"] == "member"
        # status는 응답에 포함되거나 inviteStatus로 반환될 수 있음
        assert "status" in data or "inviteStatus" in data or "id" in data
