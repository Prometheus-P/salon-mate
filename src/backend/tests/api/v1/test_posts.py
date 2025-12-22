"""
포스트 API 테스트
"""

from uuid import uuid4

import pytest
from httpx import AsyncClient

from core.security import create_tokens, hash_password
from models.shop import Shop
from models.user import User


@pytest.fixture
async def authenticated_user_with_shop(db_session):
    """매장을 가진 인증된 사용자 fixture"""
    user = User(
        email="postowner@example.com",
        name="포스트 오너",
        password_hash=hash_password("password123"),
        auth_provider="email",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    shop = Shop(
        user_id=user.id,
        name="테스트 미용실",
        type="hair",
    )
    db_session.add(shop)
    await db_session.commit()
    await db_session.refresh(shop)

    access_token, _, _ = create_tokens(str(user.id))
    return {"user": user, "shop": shop, "token": access_token}


class TestCreatePost:
    """포스트 생성 테스트"""

    @pytest.mark.asyncio
    async def test_should_create_post_with_valid_data(
        self, client: AsyncClient, authenticated_user_with_shop
    ):
        """유효한 데이터로 포스트를 생성할 수 있어야 함"""
        shop_id = authenticated_user_with_shop["shop"].id
        response = await client.post(
            f"/v1/shops/{shop_id}/posts",
            headers={
                "Authorization": f"Bearer {authenticated_user_with_shop['token']}"
            },
            json={
                "imageUrl": "https://example.com/image.jpg",
                "caption": "테스트 캡션입니다.",
                "hashtags": ["#테스트", "#포스트"],
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["caption"] == "테스트 캡션입니다."
        assert data["status"] == "draft"
        assert "id" in data

    @pytest.mark.asyncio
    async def test_should_create_scheduled_post(
        self, client: AsyncClient, authenticated_user_with_shop
    ):
        """예약 포스트를 생성할 수 있어야 함"""
        shop_id = authenticated_user_with_shop["shop"].id
        response = await client.post(
            f"/v1/shops/{shop_id}/posts",
            headers={
                "Authorization": f"Bearer {authenticated_user_with_shop['token']}"
            },
            json={
                "imageUrl": "https://example.com/image.jpg",
                "caption": "예약 포스트",
                "scheduledAt": "2025-12-25T10:00:00Z",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "scheduled"

    @pytest.mark.asyncio
    async def test_should_return_401_without_auth(self, client: AsyncClient):
        """인증 없이 포스트 생성 시 401 반환"""
        fake_shop_id = uuid4()
        response = await client.post(
            f"/v1/shops/{fake_shop_id}/posts",
            json={"imageUrl": "https://example.com/image.jpg"},
        )
        assert response.status_code == 401


class TestGetPosts:
    """포스트 목록 조회 테스트"""

    @pytest.mark.asyncio
    async def test_should_return_posts_list(
        self, client: AsyncClient, authenticated_user_with_shop
    ):
        """포스트 목록을 조회할 수 있어야 함"""
        shop_id = authenticated_user_with_shop["shop"].id
        response = await client.get(
            f"/v1/shops/{shop_id}/posts",
            headers={
                "Authorization": f"Bearer {authenticated_user_with_shop['token']}"
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "posts" in data
        assert "total" in data
        assert isinstance(data["posts"], list)

    @pytest.mark.asyncio
    async def test_should_filter_posts_by_status(
        self, client: AsyncClient, authenticated_user_with_shop
    ):
        """상태별로 포스트를 필터링할 수 있어야 함"""
        shop_id = authenticated_user_with_shop["shop"].id
        response = await client.get(
            f"/v1/shops/{shop_id}/posts?status=draft",
            headers={
                "Authorization": f"Bearer {authenticated_user_with_shop['token']}"
            },
        )

        assert response.status_code == 200
        data = response.json()
        # 필터링 결과 검증
        for post in data["posts"]:
            assert post["status"] == "draft"


class TestGetPostStats:
    """포스트 통계 테스트"""

    @pytest.mark.asyncio
    async def test_should_return_post_stats(
        self, client: AsyncClient, authenticated_user_with_shop
    ):
        """포스트 통계를 조회할 수 있어야 함"""
        shop_id = authenticated_user_with_shop["shop"].id
        response = await client.get(
            f"/v1/shops/{shop_id}/posts/stats",
            headers={
                "Authorization": f"Bearer {authenticated_user_with_shop['token']}"
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "totalPosts" in data
        assert "draftCount" in data
        assert "scheduledCount" in data
        assert "publishedCount" in data


class TestUpdatePost:
    """포스트 수정 테스트"""

    @pytest.mark.asyncio
    async def test_should_update_post_caption(
        self, client: AsyncClient, authenticated_user_with_shop
    ):
        """포스트 캡션을 수정할 수 있어야 함"""
        shop_id = authenticated_user_with_shop["shop"].id

        # 먼저 포스트 생성
        create_response = await client.post(
            f"/v1/shops/{shop_id}/posts",
            headers={
                "Authorization": f"Bearer {authenticated_user_with_shop['token']}"
            },
            json={
                "imageUrl": "https://example.com/image.jpg",
                "caption": "원래 캡션",
            },
        )
        post_id = create_response.json()["id"]

        # 포스트 수정
        response = await client.patch(
            f"/v1/shops/{shop_id}/posts/{post_id}",
            headers={
                "Authorization": f"Bearer {authenticated_user_with_shop['token']}"
            },
            json={"caption": "수정된 캡션"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["caption"] == "수정된 캡션"


class TestDeletePost:
    """포스트 삭제 테스트"""

    @pytest.mark.asyncio
    async def test_should_delete_post(
        self, client: AsyncClient, authenticated_user_with_shop
    ):
        """포스트를 삭제할 수 있어야 함"""
        shop_id = authenticated_user_with_shop["shop"].id

        # 먼저 포스트 생성
        create_response = await client.post(
            f"/v1/shops/{shop_id}/posts",
            headers={
                "Authorization": f"Bearer {authenticated_user_with_shop['token']}"
            },
            json={
                "imageUrl": "https://example.com/image.jpg",
                "caption": "삭제할 포스트",
            },
        )
        post_id = create_response.json()["id"]

        # 포스트 삭제
        response = await client.delete(
            f"/v1/shops/{shop_id}/posts/{post_id}",
            headers={
                "Authorization": f"Bearer {authenticated_user_with_shop['token']}"
            },
        )

        assert response.status_code == 204


class TestAICaption:
    """AI 캡션 생성 테스트"""

    @pytest.mark.asyncio
    async def test_should_generate_ai_caption(
        self, client: AsyncClient, authenticated_user_with_shop
    ):
        """AI 캡션을 생성할 수 있어야 함"""
        shop_id = authenticated_user_with_shop["shop"].id
        response = await client.post(
            f"/v1/shops/{shop_id}/posts/ai/generate-caption",
            headers={
                "Authorization": f"Bearer {authenticated_user_with_shop['token']}"
            },
            json={
                "prompt": "헤어 스타일 변신",
                "includeEmoji": True,
                "includeCta": True,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "caption" in data
        assert "hashtags" in data
        assert len(data["caption"]) > 0


class TestHashtagRecommendation:
    """해시태그 추천 테스트"""

    @pytest.mark.asyncio
    async def test_should_recommend_hashtags(
        self, client: AsyncClient, authenticated_user_with_shop
    ):
        """해시태그를 추천할 수 있어야 함"""
        shop_id = authenticated_user_with_shop["shop"].id
        response = await client.get(
            f"/v1/shops/{shop_id}/posts/ai/recommend-hashtags",
            headers={
                "Authorization": f"Bearer {authenticated_user_with_shop['token']}"
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "industry" in data
        assert "trending" in data


class TestOptimalTimes:
    """최적 발행 시간 테스트"""

    @pytest.mark.asyncio
    async def test_should_return_optimal_times(
        self, client: AsyncClient, authenticated_user_with_shop
    ):
        """최적 발행 시간을 조회할 수 있어야 함"""
        shop_id = authenticated_user_with_shop["shop"].id
        response = await client.get(
            f"/v1/shops/{shop_id}/posts/optimal-times",
            headers={
                "Authorization": f"Bearer {authenticated_user_with_shop['token']}"
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "times" in data
        assert len(data["times"]) > 0
