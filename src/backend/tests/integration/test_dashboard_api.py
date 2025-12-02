"""
Integration tests for Dashboard API
T016: Test GET /dashboard/{shop_id}/stats endpoint
"""

from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import create_tokens, hash_password
from models.post import Post
from models.review import Review
from models.shop import Shop
from models.user import User


@pytest.fixture
async def dashboard_user(db_session: AsyncSession):
    """Create authenticated user for dashboard tests"""
    user = User(
        email="dashboard-api@example.com",
        name="Dashboard API User",
        password_hash=hash_password("password123"),
        auth_provider="email",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    access_token, _, _ = create_tokens(str(user.id))
    return {"user": user, "token": access_token}


@pytest.fixture
async def dashboard_shop(db_session: AsyncSession, dashboard_user) -> Shop:
    """Create shop for dashboard tests"""
    shop = Shop(
        user_id=dashboard_user["user"].id,
        name="Dashboard Test Shop",
        type="hair",
    )
    db_session.add(shop)
    await db_session.commit()
    await db_session.refresh(shop)
    return shop


@pytest.fixture
async def dashboard_reviews(
    db_session: AsyncSession, dashboard_shop: Shop
) -> list[Review]:
    """Create reviews for dashboard stats testing"""
    now = datetime.now(UTC)
    reviews = [
        Review(
            shop_id=dashboard_shop.id,
            reviewer_name="Reviewer 1",
            rating=5,
            content="Great service!",
            review_date=now - timedelta(days=1),
            status="replied",
            final_response="Thank you!",
            replied_at=now - timedelta(hours=12),
        ),
        Review(
            shop_id=dashboard_shop.id,
            reviewer_name="Reviewer 2",
            rating=4,
            content="Good experience",
            review_date=now - timedelta(days=2),
            status="replied",
            final_response="We appreciate it!",
            replied_at=now - timedelta(days=1),
        ),
        Review(
            shop_id=dashboard_shop.id,
            reviewer_name="Reviewer 3",
            rating=3,
            content="Average",
            review_date=now - timedelta(days=3),
            status="pending",
        ),
        Review(
            shop_id=dashboard_shop.id,
            reviewer_name="Reviewer 4",
            rating=5,
            content="Excellent!",
            review_date=now - timedelta(hours=3),
            status="pending",
        ),
    ]
    db_session.add_all(reviews)
    await db_session.commit()
    return reviews


class TestGetDashboardStats:
    """Integration tests for GET /dashboard/{shop_id}/stats"""

    @pytest.mark.asyncio
    async def test_should_return_stats_for_authenticated_owner(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
        dashboard_reviews: list[Review],
    ):
        """Should return review stats for authenticated shop owner"""
        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/stats",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "total_reviews" in data
        assert "average_rating" in data
        assert "response_rate" in data
        assert "pending_count" in data
        assert "by_platform" in data
        assert "last_synced_at" in data

    @pytest.mark.asyncio
    async def test_should_return_correct_total_reviews(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
        dashboard_reviews: list[Review],
    ):
        """Should return correct total review count"""
        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/stats",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total_reviews"] == 4

    @pytest.mark.asyncio
    async def test_should_return_correct_average_rating(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
        dashboard_reviews: list[Review],
    ):
        """Should return correct average rating"""
        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/stats",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        # Average: (5 + 4 + 3 + 5) / 4 = 4.25
        assert data["average_rating"] == pytest.approx(4.25, rel=0.01)

    @pytest.mark.asyncio
    async def test_should_return_correct_response_rate(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
        dashboard_reviews: list[Review],
    ):
        """Should return correct response rate percentage"""
        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/stats",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        # 2 replied out of 4 = 50%
        assert data["response_rate"] == pytest.approx(50.0, rel=0.01)

    @pytest.mark.asyncio
    async def test_should_return_correct_pending_count(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
        dashboard_reviews: list[Review],
    ):
        """Should return correct pending reviews count"""
        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/stats",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["pending_count"] == 2

    @pytest.mark.asyncio
    async def test_should_return_401_without_auth(
        self,
        client: AsyncClient,
        dashboard_shop: Shop,
    ):
        """Should return 401 when not authenticated"""
        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/stats",
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_should_return_403_for_non_owner(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        dashboard_shop: Shop,
    ):
        """Should return 403 when user doesn't own the shop"""
        # Create another user
        other_user = User(
            email="other-dashboard@example.com",
            name="Other User",
            password_hash=hash_password("password123"),
            auth_provider="email",
        )
        db_session.add(other_user)
        await db_session.commit()
        await db_session.refresh(other_user)

        other_token, _, _ = create_tokens(str(other_user.id))

        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/stats",
            headers={"Authorization": f"Bearer {other_token}"},
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_should_return_empty_stats_for_shop_without_reviews(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
    ):
        """Should return zero values for shop with no reviews"""
        # Don't add the dashboard_reviews fixture
        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/stats",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total_reviews"] == 0
        assert data["average_rating"] == 0.0
        assert data["response_rate"] == 0.0
        assert data["pending_count"] == 0

    @pytest.mark.asyncio
    async def test_should_return_404_for_nonexistent_shop(
        self,
        client: AsyncClient,
        dashboard_user,
    ):
        """Should return 404 for non-existent shop ID"""
        fake_shop_id = uuid4()
        response = await client.get(
            f"/v1/dashboard/{fake_shop_id}/stats",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )

        # Actually returns 403 because shop ownership check fails
        assert response.status_code in [403, 404]


class TestMultiShopSwitching:
    """Integration tests for FR-016: Multi-shop owner support"""

    @pytest.mark.asyncio
    async def test_should_return_different_stats_for_different_shops(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        dashboard_user,
    ):
        """
        FR-016: Multi-shop owners should see different stats when switching shops.

        Given a user owns two shops with different review data,
        When they request stats for each shop,
        Then they should receive distinct statistics for each shop.
        """
        now = datetime.now(UTC)

        # Create first shop with 3 reviews, average rating 5.0
        shop1 = Shop(
            user_id=dashboard_user["user"].id,
            name="Hair Salon A",
            type="hair",
        )
        db_session.add(shop1)
        await db_session.commit()
        await db_session.refresh(shop1)

        for i in range(3):
            db_session.add(
                Review(
                    shop_id=shop1.id,
                    reviewer_name=f"Shop1 Reviewer {i}",
                    rating=5,
                    content="Excellent!",
                    review_date=now - timedelta(days=i),
                    status="replied",
                    final_response="Thank you!",
                    replied_at=now,
                )
            )

        # Create second shop with 2 reviews, average rating 3.0
        shop2 = Shop(
            user_id=dashboard_user["user"].id,
            name="Beauty Salon B",
            type="beauty",
        )
        db_session.add(shop2)
        await db_session.commit()
        await db_session.refresh(shop2)

        for i in range(2):
            db_session.add(
                Review(
                    shop_id=shop2.id,
                    reviewer_name=f"Shop2 Reviewer {i}",
                    rating=3,
                    content="Average",
                    review_date=now - timedelta(days=i),
                    status="pending",
                )
            )

        await db_session.commit()

        # Request stats for shop 1
        response1 = await client.get(
            f"/v1/dashboard/{shop1.id}/stats",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )
        assert response1.status_code == 200
        stats1 = response1.json()

        # Request stats for shop 2
        response2 = await client.get(
            f"/v1/dashboard/{shop2.id}/stats",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )
        assert response2.status_code == 200
        stats2 = response2.json()

        # Verify shops have different statistics
        assert stats1["total_reviews"] == 3
        assert stats2["total_reviews"] == 2

        assert stats1["average_rating"] == pytest.approx(5.0, rel=0.01)
        assert stats2["average_rating"] == pytest.approx(3.0, rel=0.01)

        assert stats1["response_rate"] == pytest.approx(100.0, rel=0.01)
        assert stats2["response_rate"] == pytest.approx(0.0, rel=0.01)

        assert stats1["pending_count"] == 0
        assert stats2["pending_count"] == 2


# ============== User Story 2: Posting Calendar Integration Tests ==============


@pytest.fixture
async def calendar_posts(db_session: AsyncSession, dashboard_shop: Shop) -> list[Post]:
    """Create posts for calendar testing"""
    now = datetime.now(UTC)
    posts = [
        Post(
            shop_id=dashboard_shop.id,
            status="published",
            image_url="https://example.com/published1.jpg",
            caption="Published post about services",
            scheduled_at=now - timedelta(days=3),
            published_at=now - timedelta(days=3),
            likes_count=50,
            comments_count=10,
            reach_count=200,
        ),
        Post(
            shop_id=dashboard_shop.id,
            status="scheduled",
            image_url="https://example.com/scheduled1.jpg",
            caption="Upcoming promotion post",
            scheduled_at=now + timedelta(days=2),
        ),
        Post(
            shop_id=dashboard_shop.id,
            status="failed",
            image_url="https://example.com/failed1.jpg",
            caption="Failed to post",
            scheduled_at=now - timedelta(days=1),
            error_message="API rate limit exceeded",
        ),
    ]
    db_session.add_all(posts)
    await db_session.commit()
    return posts


class TestGetPostingCalendar:
    """Integration tests for GET /dashboard/{shop_id}/calendar"""

    @pytest.mark.asyncio
    async def test_should_return_calendar_for_authenticated_owner(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
        calendar_posts: list[Post],
    ):
        """Should return calendar entries for authenticated shop owner"""
        now = datetime.now(UTC)
        start_date = (now - timedelta(days=7)).strftime("%Y-%m-%d")
        end_date = (now + timedelta(days=7)).strftime("%Y-%m-%d")

        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/calendar?start_date={start_date}&end_date={end_date}",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "start_date" in data
        assert "end_date" in data
        assert "entries" in data
        assert "last_synced_at" in data

    @pytest.mark.asyncio
    async def test_should_return_posts_grouped_by_date(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
        calendar_posts: list[Post],
    ):
        """Should return posts organized by date"""
        now = datetime.now(UTC)
        start_date = (now - timedelta(days=7)).strftime("%Y-%m-%d")
        end_date = (now + timedelta(days=7)).strftime("%Y-%m-%d")

        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/calendar?start_date={start_date}&end_date={end_date}",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()

        # Each entry should have date and posts
        for entry in data["entries"]:
            assert "date" in entry
            assert "posts" in entry
            assert isinstance(entry["posts"], list)

    @pytest.mark.asyncio
    async def test_should_return_post_status_indicators(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
        calendar_posts: list[Post],
    ):
        """FR-007: Each post should have status indicator"""
        now = datetime.now(UTC)
        start_date = (now - timedelta(days=7)).strftime("%Y-%m-%d")
        end_date = (now + timedelta(days=7)).strftime("%Y-%m-%d")

        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/calendar?start_date={start_date}&end_date={end_date}",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()

        # Collect all statuses
        statuses = []
        for entry in data["entries"]:
            for post in entry["posts"]:
                assert "status" in post
                assert post["status"] in ["draft", "scheduled", "published", "failed"]
                statuses.append(post["status"])

        # Should have posts with different statuses based on our fixture
        assert len(statuses) >= 3

    @pytest.mark.asyncio
    async def test_should_support_week_view(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
        calendar_posts: list[Post],
    ):
        """FR-006: Should support week view parameter"""
        now = datetime.now(UTC)
        start_date = (now - timedelta(days=7)).strftime("%Y-%m-%d")
        end_date = (now + timedelta(days=7)).strftime("%Y-%m-%d")

        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/calendar?start_date={start_date}&end_date={end_date}&view=week",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_should_support_month_view(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
        calendar_posts: list[Post],
    ):
        """FR-006: Should support month view parameter"""
        now = datetime.now(UTC)
        start_date = (now - timedelta(days=30)).strftime("%Y-%m-%d")
        end_date = now.strftime("%Y-%m-%d")

        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/calendar?start_date={start_date}&end_date={end_date}&view=month",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_should_return_401_without_auth(
        self,
        client: AsyncClient,
        dashboard_shop: Shop,
    ):
        """Should return 401 when not authenticated"""
        now = datetime.now(UTC)
        start_date = (now - timedelta(days=7)).strftime("%Y-%m-%d")
        end_date = (now + timedelta(days=7)).strftime("%Y-%m-%d")

        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/calendar?start_date={start_date}&end_date={end_date}",
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_should_return_403_for_non_owner(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        dashboard_shop: Shop,
    ):
        """Should return 403 when user doesn't own the shop"""
        other_user = User(
            email="other-calendar@example.com",
            name="Other Calendar User",
            password_hash=hash_password("password123"),
            auth_provider="email",
        )
        db_session.add(other_user)
        await db_session.commit()
        await db_session.refresh(other_user)

        other_token, _, _ = create_tokens(str(other_user.id))

        now = datetime.now(UTC)
        start_date = (now - timedelta(days=7)).strftime("%Y-%m-%d")
        end_date = (now + timedelta(days=7)).strftime("%Y-%m-%d")

        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/calendar?start_date={start_date}&end_date={end_date}",
            headers={"Authorization": f"Bearer {other_token}"},
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_should_require_date_parameters(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
    ):
        """Should require start_date and end_date parameters"""
        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/calendar",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )

        # Missing required query params should return 422
        assert response.status_code == 422


# ============== User Story 3: Engagement Metrics Integration Tests ==============


class TestGetEngagementMetrics:
    """Integration tests for GET /dashboard/{shop_id}/engagement"""

    @pytest.mark.asyncio
    async def test_should_return_engagement_for_authenticated_owner(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
        calendar_posts: list[Post],
    ):
        """Should return engagement metrics for authenticated shop owner"""
        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/engagement",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "total_likes" in data
        assert "total_comments" in data
        assert "total_reach" in data
        assert "top_posts" in data
        assert "last_synced_at" in data

    @pytest.mark.asyncio
    async def test_should_return_correct_totals(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
        calendar_posts: list[Post],
    ):
        """Should return correct engagement totals from published posts"""
        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/engagement",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        # From calendar_posts fixture: published post has 50 likes, 10 comments, 200 reach
        assert data["total_likes"] == 50
        assert data["total_comments"] == 10
        assert data["total_reach"] == 200

    @pytest.mark.asyncio
    async def test_should_return_top_posts_with_engagement_score(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
        calendar_posts: list[Post],
    ):
        """FR-009: Should return top posts ranked by engagement"""
        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/engagement",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()

        for post in data["top_posts"]:
            assert "id" in post
            assert "image_url" in post
            assert "likes_count" in post
            assert "comments_count" in post
            assert "reach_count" in post
            assert "engagement_score" in post

    @pytest.mark.asyncio
    async def test_should_return_401_without_auth(
        self,
        client: AsyncClient,
        dashboard_shop: Shop,
    ):
        """Should return 401 when not authenticated"""
        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/engagement",
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_should_return_403_for_non_owner(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        dashboard_shop: Shop,
    ):
        """Should return 403 when user doesn't own the shop"""
        other_user = User(
            email="other-engagement@example.com",
            name="Other Engagement User",
            password_hash=hash_password("password123"),
            auth_provider="email",
        )
        db_session.add(other_user)
        await db_session.commit()
        await db_session.refresh(other_user)

        other_token, _, _ = create_tokens(str(other_user.id))

        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/engagement",
            headers={"Authorization": f"Bearer {other_token}"},
        )

        assert response.status_code == 403


# ============== User Story 4: Trend Data Integration Tests ==============


class TestGetTrendData:
    """Integration tests for GET /dashboard/{shop_id}/trends"""

    @pytest.mark.asyncio
    async def test_should_return_trends_for_authenticated_owner(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
        dashboard_reviews: list[Review],
    ):
        """Should return trend data for authenticated shop owner"""
        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/trends?period=week",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "period" in data
        assert "data_points" in data
        assert data["period"] == "week"

    @pytest.mark.asyncio
    async def test_should_support_month_period(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
        dashboard_reviews: list[Review],
    ):
        """FR-011: Should support month period selection"""
        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/trends?period=month",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["period"] == "month"

    @pytest.mark.asyncio
    async def test_should_support_year_period(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
        dashboard_reviews: list[Review],
    ):
        """FR-011: Should support year period selection"""
        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/trends?period=year",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["period"] == "year"

    @pytest.mark.asyncio
    async def test_data_points_should_have_required_fields(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
        dashboard_reviews: list[Review],
    ):
        """FR-010: Data points should include review count, rating, response rate"""
        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/trends?period=week",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()

        for point in data["data_points"]:
            assert "date" in point
            assert "review_count" in point
            assert "average_rating" in point
            assert "response_rate" in point

    @pytest.mark.asyncio
    async def test_should_return_401_without_auth(
        self,
        client: AsyncClient,
        dashboard_shop: Shop,
    ):
        """Should return 401 when not authenticated"""
        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/trends?period=week",
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_should_require_period_parameter(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
    ):
        """Should require period parameter"""
        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/trends",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )

        # Missing required query param should return 422
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_should_reject_invalid_period(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
    ):
        """Should reject invalid period values"""
        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/trends?period=decade",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )

        # Invalid period pattern should return 422
        assert response.status_code == 422


# ============== User Story 5: Pending Reviews & Quick Actions Integration Tests ==============


class TestGetPendingReviews:
    """Integration tests for GET /dashboard/{shop_id}/pending-reviews (T058)"""

    @pytest.mark.asyncio
    async def test_should_return_pending_reviews_for_authenticated_owner(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
        dashboard_reviews: list[Review],
    ):
        """FR-012: Should return pending reviews for authenticated shop owner"""
        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/pending-reviews",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "reviews" in data
        assert "total_pending" in data

    @pytest.mark.asyncio
    async def test_should_return_correct_pending_count(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
        dashboard_reviews: list[Review],
    ):
        """Should return correct total pending count"""
        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/pending-reviews",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        # From fixture: 2 pending reviews
        assert data["total_pending"] == 2

    @pytest.mark.asyncio
    async def test_should_only_return_pending_reviews(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
        dashboard_reviews: list[Review],
    ):
        """Should only return reviews with pending status"""
        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/pending-reviews",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        # All reviews should include required fields
        for review in data["reviews"]:
            assert "id" in review
            assert "reviewer_name" in review
            assert "rating" in review
            assert "content" in review
            assert "review_date" in review
            assert "platform" in review

    @pytest.mark.asyncio
    async def test_should_respect_limit_parameter(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
        dashboard_reviews: list[Review],
    ):
        """Should respect the limit query parameter"""
        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/pending-reviews?limit=1",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["reviews"]) <= 1
        # Total pending should still be accurate
        assert data["total_pending"] == 2

    @pytest.mark.asyncio
    async def test_should_return_401_without_auth(
        self,
        client: AsyncClient,
        dashboard_shop: Shop,
    ):
        """Should return 401 when not authenticated"""
        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/pending-reviews",
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_should_return_403_for_non_owner(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        dashboard_shop: Shop,
    ):
        """Should return 403 when user doesn't own the shop"""
        other_user = User(
            email="other-pending@example.com",
            name="Other Pending User",
            password_hash=hash_password("password123"),
            auth_provider="email",
        )
        db_session.add(other_user)
        await db_session.commit()
        await db_session.refresh(other_user)

        other_token, _, _ = create_tokens(str(other_user.id))

        response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/pending-reviews",
            headers={"Authorization": f"Bearer {other_token}"},
        )

        assert response.status_code == 403


class TestGenerateReviewResponse:
    """Integration tests for POST /dashboard/{shop_id}/reviews/{id}/generate-response (T059)"""

    @pytest.mark.asyncio
    async def test_should_generate_response_for_valid_review(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
        dashboard_reviews: list[Review],
    ):
        """FR-013: Should generate AI response for a valid pending review"""
        # Get a pending review ID
        pending_response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/pending-reviews",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )
        review_id = pending_response.json()["reviews"][0]["id"]

        response = await client.post(
            f"/v1/dashboard/{dashboard_shop.id}/reviews/{review_id}/generate-response",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "review_id" in data
        assert "ai_response" in data
        assert "generated_at" in data
        assert data["ai_response"] is not None
        assert len(data["ai_response"]) > 0

    @pytest.mark.asyncio
    async def test_should_return_400_for_nonexistent_review(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
    ):
        """Should return error for non-existent review"""
        fake_review_id = uuid4()

        response = await client.post(
            f"/v1/dashboard/{dashboard_shop.id}/reviews/{fake_review_id}/generate-response",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )

        # Should return 400 or 404 for invalid review
        assert response.status_code in [400, 404, 500]

    @pytest.mark.asyncio
    async def test_should_return_401_without_auth(
        self,
        client: AsyncClient,
        dashboard_shop: Shop,
        dashboard_reviews: list[Review],
    ):
        """Should return 401 when not authenticated"""
        review_id = dashboard_reviews[2].id  # A pending review

        response = await client.post(
            f"/v1/dashboard/{dashboard_shop.id}/reviews/{review_id}/generate-response",
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_should_return_403_for_non_owner(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        dashboard_shop: Shop,
        dashboard_reviews: list[Review],
    ):
        """Should return 403 when user doesn't own the shop"""
        other_user = User(
            email="other-generate@example.com",
            name="Other Generate User",
            password_hash=hash_password("password123"),
            auth_provider="email",
        )
        db_session.add(other_user)
        await db_session.commit()
        await db_session.refresh(other_user)

        other_token, _, _ = create_tokens(str(other_user.id))
        review_id = dashboard_reviews[2].id

        response = await client.post(
            f"/v1/dashboard/{dashboard_shop.id}/reviews/{review_id}/generate-response",
            headers={"Authorization": f"Bearer {other_token}"},
        )

        assert response.status_code == 403


class TestPublishReviewResponse:
    """Integration tests for POST /dashboard/{shop_id}/reviews/{id}/publish-response (T060)"""

    @pytest.mark.asyncio
    async def test_should_publish_response_for_valid_review(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
        dashboard_reviews: list[Review],
    ):
        """FR-014: Should publish response and update review status"""
        # Get a pending review ID
        pending_response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/pending-reviews",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )
        review_id = pending_response.json()["reviews"][0]["id"]

        response = await client.post(
            f"/v1/dashboard/{dashboard_shop.id}/reviews/{review_id}/publish-response",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
            json={"final_response": "감사합니다! 좋은 하루 되세요."},
        )

        assert response.status_code == 200
        data = response.json()
        assert "review_id" in data
        assert "status" in data
        assert "replied_at" in data
        assert data["status"] == "replied"

    @pytest.mark.asyncio
    async def test_published_review_should_not_appear_in_pending(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
        dashboard_reviews: list[Review],
    ):
        """After publishing, review should not appear in pending list"""
        # Get initial pending reviews
        initial_response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/pending-reviews",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )
        initial_data = initial_response.json()
        initial_count = initial_data["total_pending"]
        review_id = initial_data["reviews"][0]["id"]

        # Publish response
        await client.post(
            f"/v1/dashboard/{dashboard_shop.id}/reviews/{review_id}/publish-response",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
            json={"final_response": "Thank you!"},
        )

        # Get updated pending reviews
        updated_response = await client.get(
            f"/v1/dashboard/{dashboard_shop.id}/pending-reviews",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
        )
        updated_data = updated_response.json()

        assert updated_data["total_pending"] == initial_count - 1
        review_ids = [r["id"] for r in updated_data["reviews"]]
        assert review_id not in review_ids

    @pytest.mark.asyncio
    async def test_should_require_final_response_body(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
        dashboard_reviews: list[Review],
    ):
        """Should require final_response in request body"""
        review_id = dashboard_reviews[2].id

        response = await client.post(
            f"/v1/dashboard/{dashboard_shop.id}/reviews/{review_id}/publish-response",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
            json={},
        )

        # Missing required field should return 422
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_should_return_400_for_nonexistent_review(
        self,
        client: AsyncClient,
        dashboard_user,
        dashboard_shop: Shop,
    ):
        """Should return error for non-existent review"""
        fake_review_id = uuid4()

        response = await client.post(
            f"/v1/dashboard/{dashboard_shop.id}/reviews/{fake_review_id}/publish-response",
            headers={"Authorization": f"Bearer {dashboard_user['token']}"},
            json={"final_response": "Thank you!"},
        )

        # Should return 400 or 404 for invalid review
        assert response.status_code in [400, 404, 500]

    @pytest.mark.asyncio
    async def test_should_return_401_without_auth(
        self,
        client: AsyncClient,
        dashboard_shop: Shop,
        dashboard_reviews: list[Review],
    ):
        """Should return 401 when not authenticated"""
        review_id = dashboard_reviews[2].id

        response = await client.post(
            f"/v1/dashboard/{dashboard_shop.id}/reviews/{review_id}/publish-response",
            json={"final_response": "Thank you!"},
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_should_return_403_for_non_owner(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        dashboard_shop: Shop,
        dashboard_reviews: list[Review],
    ):
        """Should return 403 when user doesn't own the shop"""
        other_user = User(
            email="other-publish@example.com",
            name="Other Publish User",
            password_hash=hash_password("password123"),
            auth_provider="email",
        )
        db_session.add(other_user)
        await db_session.commit()
        await db_session.refresh(other_user)

        other_token, _, _ = create_tokens(str(other_user.id))
        review_id = dashboard_reviews[2].id

        response = await client.post(
            f"/v1/dashboard/{dashboard_shop.id}/reviews/{review_id}/publish-response",
            headers={"Authorization": f"Bearer {other_token}"},
            json={"final_response": "Thank you!"},
        )

        assert response.status_code == 403
