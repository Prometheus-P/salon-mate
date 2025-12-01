"""
리뷰 CRUD API 테스트
"""

import pytest
from httpx import AsyncClient
from uuid import uuid4
from datetime import datetime, timezone

from models.user import User
from models.shop import Shop
from models.review import Review
from core.security import hash_password, create_tokens


@pytest.fixture
async def authenticated_user_with_shop(db_session):
    """매장을 가진 인증된 사용자 fixture"""
    user = User(
        email="reviewer@example.com",
        name="리뷰 테스터",
        password_hash=hash_password("password123"),
        auth_provider="email",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    shop = Shop(
        user_id=user.id,
        name="테스트 네일샵",
        type="nail",
    )
    db_session.add(shop)
    await db_session.commit()
    await db_session.refresh(shop)

    access_token, _, _ = create_tokens(str(user.id))
    return {"user": user, "shop": shop, "token": access_token}


class TestCreateReview:
    """리뷰 생성 테스트"""

    @pytest.mark.asyncio
    async def test_should_create_review_with_valid_data(
        self, client: AsyncClient, authenticated_user_with_shop
    ):
        """유효한 데이터로 리뷰를 생성할 수 있어야 함"""
        shop = authenticated_user_with_shop["shop"]

        response = await client.post(
            f"/v1/shops/{shop.id}/reviews",
            headers={"Authorization": f"Bearer {authenticated_user_with_shop['token']}"},
            json={
                "reviewerName": "김고객",
                "rating": 5,
                "content": "정말 좋았어요! 다음에도 방문할게요.",
                "reviewDate": "2024-01-15T10:00:00Z",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["reviewerName"] == "김고객"
        assert data["rating"] == 5
        assert data["status"] == "pending"
        assert "id" in data

    @pytest.mark.asyncio
    async def test_should_return_error_for_invalid_rating(
        self, client: AsyncClient, authenticated_user_with_shop
    ):
        """유효하지 않은 평점으로 에러를 반환해야 함"""
        shop = authenticated_user_with_shop["shop"]

        response = await client.post(
            f"/v1/shops/{shop.id}/reviews",
            headers={"Authorization": f"Bearer {authenticated_user_with_shop['token']}"},
            json={
                "reviewerName": "김고객",
                "rating": 6,  # 1-5만 유효
                "reviewDate": "2024-01-15T10:00:00Z",
            },
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_should_return_404_for_other_users_shop(
        self, client: AsyncClient, db_session, authenticated_user_with_shop
    ):
        """다른 사용자의 매장에 리뷰 생성 시 404를 반환해야 함"""
        # 다른 사용자와 매장 생성
        other_user = User(
            email="other_reviewer@example.com",
            name="다른 사용자",
            password_hash=hash_password("password123"),
            auth_provider="email",
        )
        db_session.add(other_user)
        await db_session.commit()
        await db_session.refresh(other_user)

        other_shop = Shop(
            user_id=other_user.id,
            name="다른 매장",
            type="hair",
        )
        db_session.add(other_shop)
        await db_session.commit()
        await db_session.refresh(other_shop)

        response = await client.post(
            f"/v1/shops/{other_shop.id}/reviews",
            headers={"Authorization": f"Bearer {authenticated_user_with_shop['token']}"},
            json={
                "reviewerName": "테스트",
                "rating": 5,
                "reviewDate": "2024-01-15T10:00:00Z",
            },
        )

        assert response.status_code == 404


class TestGetReviews:
    """리뷰 목록 조회 테스트"""

    @pytest.mark.asyncio
    async def test_should_return_shop_reviews(
        self, client: AsyncClient, db_session, authenticated_user_with_shop
    ):
        """매장의 리뷰 목록을 반환해야 함"""
        shop = authenticated_user_with_shop["shop"]

        # 리뷰 생성
        review1 = Review(
            shop_id=shop.id,
            reviewer_name="고객1",
            rating=5,
            content="좋아요",
            review_date=datetime.now(timezone.utc),
        )
        review2 = Review(
            shop_id=shop.id,
            reviewer_name="고객2",
            rating=4,
            content="괜찮아요",
            review_date=datetime.now(timezone.utc),
        )
        db_session.add_all([review1, review2])
        await db_session.commit()

        response = await client.get(
            f"/v1/shops/{shop.id}/reviews",
            headers={"Authorization": f"Bearer {authenticated_user_with_shop['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["reviews"]) == 2
        assert data["total"] == 2

    @pytest.mark.asyncio
    async def test_should_filter_reviews_by_status(
        self, client: AsyncClient, db_session, authenticated_user_with_shop
    ):
        """상태별 리뷰 필터링이 되어야 함"""
        shop = authenticated_user_with_shop["shop"]

        # 다양한 상태의 리뷰 생성
        pending_review = Review(
            shop_id=shop.id,
            reviewer_name="대기 고객",
            rating=5,
            review_date=datetime.now(timezone.utc),
            status="pending",
        )
        replied_review = Review(
            shop_id=shop.id,
            reviewer_name="답변 고객",
            rating=4,
            review_date=datetime.now(timezone.utc),
            status="replied",
        )
        db_session.add_all([pending_review, replied_review])
        await db_session.commit()

        response = await client.get(
            f"/v1/shops/{shop.id}/reviews?status=pending",
            headers={"Authorization": f"Bearer {authenticated_user_with_shop['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["reviews"]) == 1
        assert data["reviews"][0]["status"] == "pending"


class TestGetReviewById:
    """리뷰 상세 조회 테스트"""

    @pytest.mark.asyncio
    async def test_should_return_review_by_id(
        self, client: AsyncClient, db_session, authenticated_user_with_shop
    ):
        """리뷰 ID로 상세 정보를 조회할 수 있어야 함"""
        shop = authenticated_user_with_shop["shop"]

        review = Review(
            shop_id=shop.id,
            reviewer_name="상세 고객",
            rating=5,
            content="상세 리뷰 내용",
            review_date=datetime.now(timezone.utc),
        )
        db_session.add(review)
        await db_session.commit()
        await db_session.refresh(review)

        response = await client.get(
            f"/v1/shops/{shop.id}/reviews/{review.id}",
            headers={"Authorization": f"Bearer {authenticated_user_with_shop['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(review.id)
        assert data["reviewerName"] == "상세 고객"

    @pytest.mark.asyncio
    async def test_should_return_404_for_nonexistent_review(
        self, client: AsyncClient, authenticated_user_with_shop
    ):
        """존재하지 않는 리뷰 ID로 404를 반환해야 함"""
        shop = authenticated_user_with_shop["shop"]
        fake_id = uuid4()

        response = await client.get(
            f"/v1/shops/{shop.id}/reviews/{fake_id}",
            headers={"Authorization": f"Bearer {authenticated_user_with_shop['token']}"},
        )

        assert response.status_code == 404


class TestUpdateReview:
    """리뷰 수정 테스트"""

    @pytest.mark.asyncio
    async def test_should_update_review_status(
        self, client: AsyncClient, db_session, authenticated_user_with_shop
    ):
        """리뷰 상태를 수정할 수 있어야 함"""
        shop = authenticated_user_with_shop["shop"]

        review = Review(
            shop_id=shop.id,
            reviewer_name="상태 테스트",
            rating=3,
            review_date=datetime.now(timezone.utc),
            status="pending",
        )
        db_session.add(review)
        await db_session.commit()
        await db_session.refresh(review)

        response = await client.patch(
            f"/v1/shops/{shop.id}/reviews/{review.id}",
            headers={"Authorization": f"Bearer {authenticated_user_with_shop['token']}"},
            json={"status": "ignored"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ignored"

    @pytest.mark.asyncio
    async def test_should_update_final_response(
        self, client: AsyncClient, db_session, authenticated_user_with_shop
    ):
        """최종 답변을 수정할 수 있어야 함"""
        shop = authenticated_user_with_shop["shop"]

        review = Review(
            shop_id=shop.id,
            reviewer_name="답변 테스트",
            rating=4,
            review_date=datetime.now(timezone.utc),
        )
        db_session.add(review)
        await db_session.commit()
        await db_session.refresh(review)

        response = await client.patch(
            f"/v1/shops/{shop.id}/reviews/{review.id}",
            headers={"Authorization": f"Bearer {authenticated_user_with_shop['token']}"},
            json={
                "finalResponse": "감사합니다! 다음에도 방문해주세요.",
                "status": "replied",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["finalResponse"] == "감사합니다! 다음에도 방문해주세요."
        assert data["status"] == "replied"


class TestDeleteReview:
    """리뷰 삭제 테스트"""

    @pytest.mark.asyncio
    async def test_should_delete_review(
        self, client: AsyncClient, db_session, authenticated_user_with_shop
    ):
        """리뷰를 삭제할 수 있어야 함"""
        shop = authenticated_user_with_shop["shop"]

        review = Review(
            shop_id=shop.id,
            reviewer_name="삭제 테스트",
            rating=2,
            review_date=datetime.now(timezone.utc),
        )
        db_session.add(review)
        await db_session.commit()
        await db_session.refresh(review)

        response = await client.delete(
            f"/v1/shops/{shop.id}/reviews/{review.id}",
            headers={"Authorization": f"Bearer {authenticated_user_with_shop['token']}"},
        )

        assert response.status_code == 204

        # 삭제 확인
        get_response = await client.get(
            f"/v1/shops/{shop.id}/reviews/{review.id}",
            headers={"Authorization": f"Bearer {authenticated_user_with_shop['token']}"},
        )
        assert get_response.status_code == 404


class TestReviewStatistics:
    """리뷰 통계 테스트"""

    @pytest.mark.asyncio
    async def test_should_return_review_statistics(
        self, client: AsyncClient, db_session, authenticated_user_with_shop
    ):
        """리뷰 통계를 반환해야 함"""
        shop = authenticated_user_with_shop["shop"]

        # 다양한 평점의 리뷰 생성
        reviews = [
            Review(shop_id=shop.id, reviewer_name="고객1", rating=5, review_date=datetime.now(timezone.utc)),
            Review(shop_id=shop.id, reviewer_name="고객2", rating=5, review_date=datetime.now(timezone.utc)),
            Review(shop_id=shop.id, reviewer_name="고객3", rating=4, review_date=datetime.now(timezone.utc)),
            Review(shop_id=shop.id, reviewer_name="고객4", rating=3, review_date=datetime.now(timezone.utc)),
        ]
        db_session.add_all(reviews)
        await db_session.commit()

        response = await client.get(
            f"/v1/shops/{shop.id}/reviews/stats",
            headers={"Authorization": f"Bearer {authenticated_user_with_shop['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["totalReviews"] == 4
        assert data["averageRating"] == 4.25  # (5+5+4+3)/4
        assert data["pendingCount"] >= 0
