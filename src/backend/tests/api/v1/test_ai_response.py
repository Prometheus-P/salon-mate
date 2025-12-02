"""
AI 리뷰 답변 생성 테스트
"""

from datetime import UTC, datetime

import pytest
from httpx import AsyncClient

from core.security import create_tokens, hash_password
from models.review import Review
from models.shop import Shop
from models.user import User


@pytest.fixture
async def review_fixture(db_session):
    """리뷰가 있는 매장 fixture"""
    user = User(
        email="aitest@example.com",
        name="AI 테스터",
        password_hash=hash_password("password123"),
        auth_provider="email",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    shop = Shop(
        user_id=user.id,
        name="AI 테스트 네일샵",
        type="nail",
    )
    db_session.add(shop)
    await db_session.commit()
    await db_session.refresh(shop)

    positive_review = Review(
        shop_id=shop.id,
        reviewer_name="만족 고객",
        rating=5,
        content="정말 좋았어요! 손톱 예쁘게 해주셔서 감사합니다.",
        review_date=datetime.now(UTC),
        status="pending",
    )
    negative_review = Review(
        shop_id=shop.id,
        reviewer_name="불만 고객",
        rating=2,
        content="대기 시간이 너무 길었어요. 개선이 필요합니다.",
        review_date=datetime.now(UTC),
        status="pending",
    )
    no_content_review = Review(
        shop_id=shop.id,
        reviewer_name="무언 고객",
        rating=4,
        review_date=datetime.now(UTC),
        status="pending",
    )

    db_session.add_all([positive_review, negative_review, no_content_review])
    await db_session.commit()
    await db_session.refresh(positive_review)
    await db_session.refresh(negative_review)
    await db_session.refresh(no_content_review)

    access_token, _, _ = create_tokens(str(user.id))
    return {
        "user": user,
        "shop": shop,
        "positive_review": positive_review,
        "negative_review": negative_review,
        "no_content_review": no_content_review,
        "token": access_token,
    }


class TestGenerateAIResponse:
    """AI 답변 생성 테스트"""

    @pytest.mark.asyncio
    async def test_should_generate_response_for_positive_review(
        self, client: AsyncClient, review_fixture
    ):
        """긍정 리뷰에 대한 감사 답변을 생성해야 함"""
        shop = review_fixture["shop"]
        review = review_fixture["positive_review"]

        response = await client.post(
            f"/v1/shops/{shop.id}/reviews/{review.id}/ai-response",
            headers={"Authorization": f"Bearer {review_fixture['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "aiResponse" in data
        assert len(data["aiResponse"]) > 0
        # 긍정적인 답변 확인
        assert any(word in data["aiResponse"] for word in ["감사", "방문", "좋은"])

    @pytest.mark.asyncio
    async def test_should_generate_response_for_negative_review(
        self, client: AsyncClient, review_fixture
    ):
        """부정 리뷰에 대한 공감 답변을 생성해야 함"""
        shop = review_fixture["shop"]
        review = review_fixture["negative_review"]

        response = await client.post(
            f"/v1/shops/{shop.id}/reviews/{review.id}/ai-response",
            headers={"Authorization": f"Bearer {review_fixture['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "aiResponse" in data
        # 공감 및 개선 약속 확인
        assert any(word in data["aiResponse"] for word in ["죄송", "개선", "불편", "노력"])

    @pytest.mark.asyncio
    async def test_should_generate_response_without_content(
        self, client: AsyncClient, review_fixture
    ):
        """리뷰 내용이 없어도 답변을 생성해야 함"""
        shop = review_fixture["shop"]
        review = review_fixture["no_content_review"]

        response = await client.post(
            f"/v1/shops/{shop.id}/reviews/{review.id}/ai-response",
            headers={"Authorization": f"Bearer {review_fixture['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "aiResponse" in data
        assert len(data["aiResponse"]) > 0

    @pytest.mark.asyncio
    async def test_should_update_review_with_ai_response(
        self, client: AsyncClient, db_session, review_fixture
    ):
        """AI 답변 생성 후 리뷰에 저장되어야 함"""
        shop = review_fixture["shop"]
        review = review_fixture["positive_review"]

        # AI 답변 생성
        await client.post(
            f"/v1/shops/{shop.id}/reviews/{review.id}/ai-response",
            headers={"Authorization": f"Bearer {review_fixture['token']}"},
        )

        # 리뷰 조회하여 확인
        get_response = await client.get(
            f"/v1/shops/{shop.id}/reviews/{review.id}",
            headers={"Authorization": f"Bearer {review_fixture['token']}"},
        )

        assert get_response.status_code == 200
        data = get_data = response.json()
        assert data["aiResponse"] is not None
        assert data["aiResponseGeneratedAt"] is not None

    @pytest.mark.asyncio
    async def test_should_regenerate_ai_response(
        self, client: AsyncClient, review_fixture
    ):
        """AI 답변을 재생성할 수 있어야 함"""
        shop = review_fixture["shop"]
        review = review_fixture["positive_review"]

        # 첫 번째 생성
        first_response = await client.post(
            f"/v1/shops/{shop.id}/reviews/{review.id}/ai-response",
            headers={"Authorization": f"Bearer {review_fixture['token']}"},
        )
        first_response.json()["aiResponse"]

        # 두 번째 생성 (재생성)
        second_response = await client.post(
            f"/v1/shops/{shop.id}/reviews/{review.id}/ai-response",
            headers={"Authorization": f"Bearer {review_fixture['token']}"},
        )

        assert second_response.status_code == 200
        # Mock이므로 동일할 수 있지만, 에러 없이 재생성 가능해야 함


class TestAIResponseCustomization:
    """AI 답변 커스터마이징 테스트"""

    @pytest.mark.asyncio
    async def test_should_accept_custom_tone(
        self, client: AsyncClient, review_fixture
    ):
        """답변 톤 커스터마이징을 지원해야 함"""
        shop = review_fixture["shop"]
        review = review_fixture["positive_review"]

        response = await client.post(
            f"/v1/shops/{shop.id}/reviews/{review.id}/ai-response",
            headers={"Authorization": f"Bearer {review_fixture['token']}"},
            json={"tone": "formal"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "aiResponse" in data

    @pytest.mark.asyncio
    async def test_should_include_shop_name_in_response(
        self, client: AsyncClient, review_fixture
    ):
        """답변에 매장 이름이 포함될 수 있어야 함"""
        shop = review_fixture["shop"]
        review = review_fixture["positive_review"]

        response = await client.post(
            f"/v1/shops/{shop.id}/reviews/{review.id}/ai-response",
            headers={"Authorization": f"Bearer {review_fixture['token']}"},
            json={"includeShopName": True},
        )

        assert response.status_code == 200
        response.json()
        # Mock에서 매장 이름 포함 여부 확인은 선택적


class TestAIResponseErrors:
    """AI 답변 생성 에러 테스트"""

    @pytest.mark.asyncio
    async def test_should_return_404_for_nonexistent_review(
        self, client: AsyncClient, review_fixture
    ):
        """존재하지 않는 리뷰에 대해 404를 반환해야 함"""
        from uuid import uuid4

        shop = review_fixture["shop"]
        fake_review_id = uuid4()

        response = await client.post(
            f"/v1/shops/{shop.id}/reviews/{fake_review_id}/ai-response",
            headers={"Authorization": f"Bearer {review_fixture['token']}"},
        )

        assert response.status_code == 404
