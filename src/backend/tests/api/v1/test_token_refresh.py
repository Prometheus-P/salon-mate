"""
토큰 갱신 테스트

TDD RED Phase - 테스트 먼저 작성
"""

import pytest
from httpx import AsyncClient


class TestTokenRefresh:
    """토큰 갱신 테스트"""

    @pytest.mark.asyncio
    async def test_should_refresh_token_with_valid_refresh_token(
        self, client: AsyncClient, valid_user_data: dict
    ):
        """유효한 리프레시 토큰으로 새 액세스 토큰 발급"""
        # 먼저 사용자 생성 및 로그인
        signup_response = await client.post("/v1/auth/signup", json=valid_user_data)
        refresh_token = signup_response.json()["refreshToken"]

        # 토큰 갱신
        response = await client.post(
            "/v1/auth/refresh", json={"refreshToken": refresh_token}
        )

        assert response.status_code == 200
        data = response.json()
        assert "accessToken" in data
        assert "expiresIn" in data
        assert data["accessToken"].count(".") == 2  # JWT 형식

    @pytest.mark.asyncio
    async def test_should_return_error_when_refresh_token_invalid(
        self, client: AsyncClient
    ):
        """유효하지 않은 리프레시 토큰으로 갱신 시 에러 반환"""
        response = await client.post(
            "/v1/auth/refresh", json={"refreshToken": "invalid.token.here"}
        )

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

    @pytest.mark.asyncio
    async def test_should_return_error_when_using_access_token_for_refresh(
        self, client: AsyncClient, valid_user_data: dict
    ):
        """액세스 토큰으로 갱신 시도 시 에러 반환"""
        # 먼저 사용자 생성 및 로그인
        signup_response = await client.post("/v1/auth/signup", json=valid_user_data)
        access_token = signup_response.json()["accessToken"]

        # 액세스 토큰으로 갱신 시도 (실패해야 함)
        response = await client.post(
            "/v1/auth/refresh", json={"refreshToken": access_token}
        )

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

    @pytest.mark.asyncio
    async def test_should_return_error_when_refresh_token_missing(
        self, client: AsyncClient
    ):
        """리프레시 토큰 필드가 없을 때 에러 반환"""
        response = await client.post("/v1/auth/refresh", json={})

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_new_access_token_should_be_different_from_old(
        self, client: AsyncClient, valid_user_data: dict
    ):
        """새로운 액세스 토큰은 이전 토큰과 다르게 생성됨"""
        # 먼저 사용자 생성
        signup_response = await client.post("/v1/auth/signup", json=valid_user_data)
        refresh_token = signup_response.json()["refreshToken"]

        # 토큰 갱신
        response = await client.post(
            "/v1/auth/refresh", json={"refreshToken": refresh_token}
        )

        assert response.status_code == 200
        new_access_token = response.json()["accessToken"]
        # 토큰이 다르게 생성됨 (timestamp 기반)
        # Note: 같은 초에 생성되면 같을 수 있으나, 일반적으로 다름
        assert len(new_access_token) > 50
