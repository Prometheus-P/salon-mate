"""
사용자 로그인 테스트

TDD RED Phase - 테스트 먼저 작성
"""

import pytest
from httpx import AsyncClient


class TestUserLogin:
    """사용자 로그인 테스트"""

    @pytest.mark.asyncio
    async def test_should_login_with_valid_credentials(
        self, client: AsyncClient, valid_user_data: dict
    ):
        """유효한 이메일과 비밀번호로 로그인 성공"""
        # 먼저 사용자 생성
        await client.post("/v1/auth/signup", json=valid_user_data)

        # 로그인 시도
        login_data = {
            "email": valid_user_data["email"],
            "password": valid_user_data["password"],
        }
        response = await client.post("/v1/auth/login", json=login_data)

        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == valid_user_data["email"]
        assert "accessToken" in data
        assert "refreshToken" in data
        assert "expiresIn" in data

    @pytest.mark.asyncio
    async def test_should_return_error_when_email_not_found(
        self, client: AsyncClient
    ):
        """존재하지 않는 이메일로 로그인 시 에러 반환"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "SecurePass123!",
        }
        response = await client.post("/v1/auth/login", json=login_data)

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

    @pytest.mark.asyncio
    async def test_should_return_error_when_password_wrong(
        self, client: AsyncClient, valid_user_data: dict
    ):
        """비밀번호가 틀렸을 때 에러 반환"""
        # 먼저 사용자 생성
        await client.post("/v1/auth/signup", json=valid_user_data)

        # 잘못된 비밀번호로 로그인 시도
        login_data = {
            "email": valid_user_data["email"],
            "password": "WrongPassword123!",
        }
        response = await client.post("/v1/auth/login", json=login_data)

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

    @pytest.mark.asyncio
    async def test_should_return_error_when_email_missing(
        self, client: AsyncClient
    ):
        """이메일 필드가 없을 때 에러 반환"""
        login_data = {"password": "SecurePass123!"}
        response = await client.post("/v1/auth/login", json=login_data)

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_should_return_error_when_password_missing(
        self, client: AsyncClient
    ):
        """비밀번호 필드가 없을 때 에러 반환"""
        login_data = {"email": "test@example.com"}
        response = await client.post("/v1/auth/login", json=login_data)

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_password_should_not_be_returned_in_login_response(
        self, client: AsyncClient, valid_user_data: dict
    ):
        """로그인 응답에 비밀번호가 포함되지 않아야 함"""
        # 먼저 사용자 생성
        await client.post("/v1/auth/signup", json=valid_user_data)

        # 로그인
        login_data = {
            "email": valid_user_data["email"],
            "password": valid_user_data["password"],
        }
        response = await client.post("/v1/auth/login", json=login_data)

        assert response.status_code == 200
        data = response.json()
        assert "password" not in data["user"]
        assert "password_hash" not in data["user"]
        assert "passwordHash" not in data["user"]

    @pytest.mark.asyncio
    async def test_should_return_valid_jwt_token(
        self, client: AsyncClient, valid_user_data: dict
    ):
        """로그인 시 유효한 JWT 토큰 반환"""
        # 사용자 생성
        await client.post("/v1/auth/signup", json=valid_user_data)

        # 로그인
        login_data = {
            "email": valid_user_data["email"],
            "password": valid_user_data["password"],
        }
        response = await client.post("/v1/auth/login", json=login_data)

        assert response.status_code == 200
        data = response.json()

        # JWT 토큰 형식 확인 (header.payload.signature)
        access_token = data["accessToken"]
        assert access_token.count(".") == 2
        assert len(access_token) > 50

        refresh_token = data["refreshToken"]
        assert refresh_token.count(".") == 2
        assert len(refresh_token) > 50
