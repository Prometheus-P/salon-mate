"""
매장(Shop) CRUD API 테스트
"""

from uuid import uuid4

import pytest
from httpx import AsyncClient

from core.security import create_tokens, hash_password
from models.shop import Shop
from models.user import User


@pytest.fixture
async def authenticated_user(db_session):
    """인증된 사용자 fixture"""
    user = User(
        email="shopowner@example.com",
        name="매장 오너",
        password_hash=hash_password("password123"),
        auth_provider="email",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    access_token, _, _ = create_tokens(str(user.id))
    return {"user": user, "token": access_token}


class TestCreateShop:
    """매장 생성 테스트"""

    @pytest.mark.asyncio
    async def test_should_create_shop_with_valid_data(
        self, client: AsyncClient, authenticated_user
    ):
        """유효한 데이터로 매장을 생성할 수 있어야 함"""
        response = await client.post(
            "/v1/shops",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
            json={
                "name": "예쁜 네일샵",
                "type": "nail",
                "address": "서울시 강남구 역삼동 123-45",
                "phone": "02-1234-5678",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "예쁜 네일샵"
        assert data["type"] == "nail"
        assert data["address"] == "서울시 강남구 역삼동 123-45"
        assert "id" in data
        assert "createdAt" in data

    @pytest.mark.asyncio
    async def test_should_create_shop_without_optional_fields(
        self, client: AsyncClient, authenticated_user
    ):
        """선택 필드 없이도 매장을 생성할 수 있어야 함"""
        response = await client.post(
            "/v1/shops",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
            json={
                "name": "심플 헤어샵",
                "type": "hair",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "심플 헤어샵"
        assert data["type"] == "hair"
        assert data["address"] is None

    @pytest.mark.asyncio
    async def test_should_return_error_for_invalid_shop_type(
        self, client: AsyncClient, authenticated_user
    ):
        """유효하지 않은 매장 타입으로 에러를 반환해야 함"""
        response = await client.post(
            "/v1/shops",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
            json={
                "name": "잘못된 매장",
                "type": "invalid_type",
            },
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_should_return_401_without_authentication(self, client: AsyncClient):
        """인증 없이 매장 생성 시 401을 반환해야 함"""
        response = await client.post(
            "/v1/shops",
            json={"name": "테스트 매장", "type": "nail"},
        )

        assert response.status_code == 401


class TestGetShops:
    """매장 목록 조회 테스트"""

    @pytest.mark.asyncio
    async def test_should_return_user_shops(
        self, client: AsyncClient, db_session, authenticated_user
    ):
        """사용자의 매장 목록을 반환해야 함"""
        user = authenticated_user["user"]

        # 매장 생성
        shop1 = Shop(
            user_id=user.id,
            name="네일샵 1",
            type="nail",
        )
        shop2 = Shop(
            user_id=user.id,
            name="헤어샵 1",
            type="hair",
        )
        db_session.add_all([shop1, shop2])
        await db_session.commit()

        response = await client.get(
            "/v1/shops",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["shops"]) == 2
        assert data["total"] == 2

    @pytest.mark.asyncio
    async def test_should_return_empty_list_when_no_shops(
        self, client: AsyncClient, authenticated_user
    ):
        """매장이 없을 때 빈 목록을 반환해야 함"""
        response = await client.get(
            "/v1/shops",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["shops"]) == 0
        assert data["total"] == 0

    @pytest.mark.asyncio
    async def test_should_not_return_other_users_shops(
        self, client: AsyncClient, db_session, authenticated_user
    ):
        """다른 사용자의 매장은 반환하지 않아야 함"""
        # 다른 사용자와 매장 생성
        other_user = User(
            email="other@example.com",
            name="다른 사용자",
            password_hash=hash_password("password123"),
            auth_provider="email",
        )
        db_session.add(other_user)
        await db_session.commit()
        await db_session.refresh(other_user)

        other_shop = Shop(
            user_id=other_user.id,
            name="다른 사용자 매장",
            type="nail",
        )
        db_session.add(other_shop)
        await db_session.commit()

        response = await client.get(
            "/v1/shops",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["shops"]) == 0


class TestGetShopById:
    """매장 상세 조회 테스트"""

    @pytest.mark.asyncio
    async def test_should_return_shop_by_id(
        self, client: AsyncClient, db_session, authenticated_user
    ):
        """매장 ID로 상세 정보를 조회할 수 있어야 함"""
        user = authenticated_user["user"]

        shop = Shop(
            user_id=user.id,
            name="조회 테스트 매장",
            type="skin",
            address="서울시 강남구",
        )
        db_session.add(shop)
        await db_session.commit()
        await db_session.refresh(shop)

        response = await client.get(
            f"/v1/shops/{shop.id}",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(shop.id)
        assert data["name"] == "조회 테스트 매장"

    @pytest.mark.asyncio
    async def test_should_return_404_for_nonexistent_shop(
        self, client: AsyncClient, authenticated_user
    ):
        """존재하지 않는 매장 ID로 404를 반환해야 함"""
        fake_id = uuid4()
        response = await client.get(
            f"/v1/shops/{fake_id}",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_should_return_404_for_other_users_shop(
        self, client: AsyncClient, db_session, authenticated_user
    ):
        """다른 사용자의 매장 조회 시 404를 반환해야 함"""
        # 다른 사용자와 매장 생성
        other_user = User(
            email="another@example.com",
            name="다른 사용자",
            password_hash=hash_password("password123"),
            auth_provider="email",
        )
        db_session.add(other_user)
        await db_session.commit()
        await db_session.refresh(other_user)

        other_shop = Shop(
            user_id=other_user.id,
            name="다른 사용자 매장",
            type="lash",
        )
        db_session.add(other_shop)
        await db_session.commit()
        await db_session.refresh(other_shop)

        response = await client.get(
            f"/v1/shops/{other_shop.id}",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
        )

        assert response.status_code == 404


class TestUpdateShop:
    """매장 수정 테스트"""

    @pytest.mark.asyncio
    async def test_should_update_shop_name(
        self, client: AsyncClient, db_session, authenticated_user
    ):
        """매장 이름을 수정할 수 있어야 함"""
        user = authenticated_user["user"]

        shop = Shop(
            user_id=user.id,
            name="원래 매장명",
            type="nail",
        )
        db_session.add(shop)
        await db_session.commit()
        await db_session.refresh(shop)

        response = await client.patch(
            f"/v1/shops/{shop.id}",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
            json={"name": "새로운 매장명"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "새로운 매장명"

    @pytest.mark.asyncio
    async def test_should_update_multiple_fields(
        self, client: AsyncClient, db_session, authenticated_user
    ):
        """여러 필드를 동시에 수정할 수 있어야 함"""
        user = authenticated_user["user"]

        shop = Shop(
            user_id=user.id,
            name="수정 테스트",
            type="hair",
        )
        db_session.add(shop)
        await db_session.commit()
        await db_session.refresh(shop)

        response = await client.patch(
            f"/v1/shops/{shop.id}",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
            json={
                "name": "수정된 매장명",
                "address": "새로운 주소",
                "phone": "010-9999-8888",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "수정된 매장명"
        assert data["address"] == "새로운 주소"
        assert data["phone"] == "010-9999-8888"

    @pytest.mark.asyncio
    async def test_should_return_404_when_updating_other_users_shop(
        self, client: AsyncClient, db_session, authenticated_user
    ):
        """다른 사용자의 매장 수정 시 404를 반환해야 함"""
        other_user = User(
            email="updatetest@example.com",
            name="다른 사용자",
            password_hash=hash_password("password123"),
            auth_provider="email",
        )
        db_session.add(other_user)
        await db_session.commit()
        await db_session.refresh(other_user)

        other_shop = Shop(
            user_id=other_user.id,
            name="다른 사용자 매장",
            type="nail",
        )
        db_session.add(other_shop)
        await db_session.commit()
        await db_session.refresh(other_shop)

        response = await client.patch(
            f"/v1/shops/{other_shop.id}",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
            json={"name": "해킹 시도"},
        )

        assert response.status_code == 404


class TestDeleteShop:
    """매장 삭제 테스트"""

    @pytest.mark.asyncio
    async def test_should_delete_shop(
        self, client: AsyncClient, db_session, authenticated_user
    ):
        """매장을 삭제할 수 있어야 함"""
        user = authenticated_user["user"]

        shop = Shop(
            user_id=user.id,
            name="삭제할 매장",
            type="nail",
        )
        db_session.add(shop)
        await db_session.commit()
        await db_session.refresh(shop)

        response = await client.delete(
            f"/v1/shops/{shop.id}",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
        )

        assert response.status_code == 204

        # 삭제 확인
        get_response = await client.get(
            f"/v1/shops/{shop.id}",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
        )
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_should_return_404_when_deleting_nonexistent_shop(
        self, client: AsyncClient, authenticated_user
    ):
        """존재하지 않는 매장 삭제 시 404를 반환해야 함"""
        fake_id = uuid4()
        response = await client.delete(
            f"/v1/shops/{fake_id}",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_should_return_404_when_deleting_other_users_shop(
        self, client: AsyncClient, db_session, authenticated_user
    ):
        """다른 사용자의 매장 삭제 시 404를 반환해야 함"""
        other_user = User(
            email="deletetest@example.com",
            name="다른 사용자",
            password_hash=hash_password("password123"),
            auth_provider="email",
        )
        db_session.add(other_user)
        await db_session.commit()
        await db_session.refresh(other_user)

        other_shop = Shop(
            user_id=other_user.id,
            name="다른 사용자 매장",
            type="nail",
        )
        db_session.add(other_shop)
        await db_session.commit()
        await db_session.refresh(other_shop)

        response = await client.delete(
            f"/v1/shops/{other_shop.id}",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
        )

        assert response.status_code == 404
