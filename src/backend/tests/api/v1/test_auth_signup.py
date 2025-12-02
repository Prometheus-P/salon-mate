"""
사용자 회원가입 테스트

TDD RED Phase - 테스트 먼저 작성
"""

import pytest
from httpx import AsyncClient


class TestUserSignup:
    """사용자 회원가입 테스트"""

    @pytest.mark.asyncio
    async def test_should_create_user_when_valid_email_and_password(
        self, client: AsyncClient, valid_user_data: dict
    ):
        """유효한 이메일과 비밀번호로 사용자 생성 성공"""
        response = await client.post("/v1/auth/signup", json=valid_user_data)

        assert response.status_code == 201
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == valid_user_data["email"]
        assert data["user"]["name"] == valid_user_data["name"]
        assert "accessToken" in data
        assert "refreshToken" in data
        assert "expiresIn" in data

    @pytest.mark.asyncio
    async def test_should_return_error_when_email_already_exists(
        self, client: AsyncClient, valid_user_data: dict
    ):
        """이미 존재하는 이메일로 가입 시 에러 반환"""
        # 첫 번째 가입 (성공)
        await client.post("/v1/auth/signup", json=valid_user_data)

        # 동일 이메일로 두 번째 가입 시도 (실패해야 함)
        response = await client.post("/v1/auth/signup", json=valid_user_data)

        assert response.status_code == 409
        data = response.json()
        assert "detail" in data
        assert (
            "이미 존재" in data["detail"] or "already exists" in data["detail"].lower()
        )

    @pytest.mark.asyncio
    async def test_should_return_error_when_password_too_short(
        self, client: AsyncClient, valid_user_data: dict
    ):
        """비밀번호가 8자 미만일 때 에러 반환"""
        invalid_data = {**valid_user_data, "password": "short"}
        response = await client.post("/v1/auth/signup", json=invalid_data)

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    @pytest.mark.asyncio
    async def test_should_return_error_when_invalid_email_format(
        self, client: AsyncClient, valid_user_data: dict
    ):
        """이메일 형식이 올바르지 않을 때 에러 반환"""
        invalid_data = {**valid_user_data, "email": "invalid-email"}
        response = await client.post("/v1/auth/signup", json=invalid_data)

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    @pytest.mark.asyncio
    async def test_should_return_error_when_name_too_short(
        self, client: AsyncClient, valid_user_data: dict
    ):
        """이름이 2자 미만일 때 에러 반환"""
        invalid_data = {**valid_user_data, "name": "A"}
        response = await client.post("/v1/auth/signup", json=invalid_data)

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    @pytest.mark.asyncio
    async def test_should_return_error_when_email_missing(self, client: AsyncClient):
        """이메일 필드가 없을 때 에러 반환"""
        invalid_data = {"password": "SecurePass123!", "name": "테스트"}
        response = await client.post("/v1/auth/signup", json=invalid_data)

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    @pytest.mark.asyncio
    async def test_should_return_error_when_password_missing(self, client: AsyncClient):
        """비밀번호 필드가 없을 때 에러 반환"""
        invalid_data = {"email": "test@example.com", "name": "테스트"}
        response = await client.post("/v1/auth/signup", json=invalid_data)

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    @pytest.mark.asyncio
    async def test_should_create_user_with_shop_info(
        self, client: AsyncClient, valid_user_with_shop_data: dict
    ):
        """매장 정보와 함께 사용자 생성 성공"""
        response = await client.post("/v1/auth/signup", json=valid_user_with_shop_data)

        assert response.status_code == 201
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == valid_user_with_shop_data["email"]

    @pytest.mark.asyncio
    async def test_password_should_not_be_returned_in_response(
        self, client: AsyncClient, valid_user_data: dict
    ):
        """응답에 비밀번호가 포함되지 않아야 함"""
        response = await client.post("/v1/auth/signup", json=valid_user_data)

        assert response.status_code == 201
        data = response.json()
        assert "password" not in data["user"]
        assert "password_hash" not in data["user"]
        assert "passwordHash" not in data["user"]
