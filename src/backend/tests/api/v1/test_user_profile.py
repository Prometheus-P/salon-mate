"""
사용자 프로필 API 테스트
프로필 조회/수정 테스트
"""

import pytest
from httpx import AsyncClient
from uuid import uuid4

from models.user import User
from core.security import hash_password, create_tokens


class TestGetUserProfile:
    """사용자 프로필 조회 테스트"""

    @pytest.mark.asyncio
    async def test_should_return_current_user_profile(
        self, client: AsyncClient, db_session
    ):
        """인증된 사용자의 프로필을 반환해야 함"""
        # 사용자 생성
        user = User(
            email="test@example.com",
            name="테스트 사용자",
            password_hash=hash_password("password123"),
            auth_provider="email",
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        # 토큰 생성
        access_token, _, _ = create_tokens(str(user.id))

        # 프로필 조회
        response = await client.get(
            "/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["name"] == "테스트 사용자"
        assert "id" in data
        assert "createdAt" in data

    @pytest.mark.asyncio
    async def test_should_return_401_without_token(self, client: AsyncClient):
        """토큰 없이 요청 시 401을 반환해야 함"""
        response = await client.get("/v1/users/me")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_should_return_401_with_invalid_token(self, client: AsyncClient):
        """유효하지 않은 토큰으로 요청 시 401을 반환해야 함"""
        response = await client.get(
            "/v1/users/me",
            headers={"Authorization": "Bearer invalid-token"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_should_return_401_with_expired_token(
        self, client: AsyncClient, db_session
    ):
        """만료된 토큰으로 요청 시 401을 반환해야 함"""
        from datetime import timedelta
        from core.security import create_access_token

        user = User(
            email="expired@example.com",
            name="만료 테스트",
            password_hash=hash_password("password123"),
            auth_provider="email",
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        # 만료된 토큰 생성 (음수 timedelta)
        expired_token = create_access_token(
            {"sub": str(user.id)},
            expires_delta=timedelta(seconds=-1),
        )

        response = await client.get(
            "/v1/users/me",
            headers={"Authorization": f"Bearer {expired_token}"},
        )
        assert response.status_code == 401


class TestUpdateUserProfile:
    """사용자 프로필 수정 테스트"""

    @pytest.mark.asyncio
    async def test_should_update_user_name(
        self, client: AsyncClient, db_session
    ):
        """사용자 이름을 수정할 수 있어야 함"""
        user = User(
            email="update@example.com",
            name="원래 이름",
            password_hash=hash_password("password123"),
            auth_provider="email",
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        access_token, _, _ = create_tokens(str(user.id))

        response = await client.patch(
            "/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"name": "새로운 이름"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "새로운 이름"

    @pytest.mark.asyncio
    async def test_should_update_avatar_url(
        self, client: AsyncClient, db_session
    ):
        """프로필 이미지 URL을 수정할 수 있어야 함"""
        user = User(
            email="avatar@example.com",
            name="아바타 테스트",
            password_hash=hash_password("password123"),
            auth_provider="email",
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        access_token, _, _ = create_tokens(str(user.id))

        response = await client.patch(
            "/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"avatarUrl": "https://example.com/new-avatar.jpg"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["avatarUrl"] == "https://example.com/new-avatar.jpg"

    @pytest.mark.asyncio
    async def test_should_not_update_email(
        self, client: AsyncClient, db_session
    ):
        """이메일은 수정할 수 없어야 함"""
        user = User(
            email="noemail@example.com",
            name="이메일 테스트",
            password_hash=hash_password("password123"),
            auth_provider="email",
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        access_token, _, _ = create_tokens(str(user.id))

        # 이메일 변경 시도 (무시되어야 함)
        response = await client.patch(
            "/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"name": "이름 변경", "email": "newemail@example.com"},
        )

        assert response.status_code == 200
        data = response.json()
        # 이메일은 변경되지 않아야 함
        assert data["email"] == "noemail@example.com"

    @pytest.mark.asyncio
    async def test_should_return_error_for_invalid_name(
        self, client: AsyncClient, db_session
    ):
        """유효하지 않은 이름으로 수정 시 에러를 반환해야 함"""
        user = User(
            email="invalid@example.com",
            name="유효성 테스트",
            password_hash=hash_password("password123"),
            auth_provider="email",
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        access_token, _, _ = create_tokens(str(user.id))

        # 너무 짧은 이름
        response = await client.patch(
            "/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"name": "a"},  # 최소 2자 필요
        )

        assert response.status_code == 422


class TestChangePassword:
    """비밀번호 변경 테스트"""

    @pytest.mark.asyncio
    async def test_should_change_password_with_valid_current_password(
        self, client: AsyncClient, db_session
    ):
        """올바른 현재 비밀번호로 비밀번호를 변경할 수 있어야 함"""
        user = User(
            email="password@example.com",
            name="비밀번호 테스트",
            password_hash=hash_password("OldPassword123!"),
            auth_provider="email",
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        access_token, _, _ = create_tokens(str(user.id))

        response = await client.post(
            "/v1/users/me/password",
            headers={"Authorization": f"Bearer {access_token}"},
            json={
                "currentPassword": "OldPassword123!",
                "newPassword": "NewPassword456!",
            },
        )

        assert response.status_code == 200
        assert response.json()["message"] == "비밀번호가 변경되었습니다."

        # 새 비밀번호로 로그인 확인
        login_response = await client.post(
            "/v1/auth/login",
            json={
                "email": "password@example.com",
                "password": "NewPassword456!",
            },
        )
        assert login_response.status_code == 200

    @pytest.mark.asyncio
    async def test_should_return_error_with_wrong_current_password(
        self, client: AsyncClient, db_session
    ):
        """잘못된 현재 비밀번호로 변경 시 에러를 반환해야 함"""
        user = User(
            email="wrongpw@example.com",
            name="비밀번호 테스트",
            password_hash=hash_password("CorrectPassword123!"),
            auth_provider="email",
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        access_token, _, _ = create_tokens(str(user.id))

        response = await client.post(
            "/v1/users/me/password",
            headers={"Authorization": f"Bearer {access_token}"},
            json={
                "currentPassword": "WrongPassword!",
                "newPassword": "NewPassword456!",
            },
        )

        assert response.status_code == 400
        assert "비밀번호" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_should_return_error_for_social_login_user(
        self, client: AsyncClient, db_session
    ):
        """소셜 로그인 사용자가 비밀번호 변경 시도 시 에러를 반환해야 함"""
        user = User(
            email="social@example.com",
            name="소셜 사용자",
            auth_provider="google",  # 소셜 로그인 사용자
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        access_token, _, _ = create_tokens(str(user.id))

        response = await client.post(
            "/v1/users/me/password",
            headers={"Authorization": f"Bearer {access_token}"},
            json={
                "currentPassword": "AnyPassword!",
                "newPassword": "NewPassword456!",
            },
        )

        assert response.status_code == 400
        assert "소셜" in response.json()["detail"] or "비밀번호" in response.json()["detail"]
