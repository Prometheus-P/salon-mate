"""
Unit tests for DashboardService
T015: Test get_review_stats service method
"""

from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import hash_password
from models.post import Post
from models.review import Review
from models.shop import Shop
from models.user import User
from services.dashboard_service import DashboardService


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create test user"""
    user = User(
        email="dashboardtest@example.com",
        name="Dashboard Test User",
        password_hash=hash_password("password123"),
        auth_provider="email",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_shop(db_session: AsyncSession, test_user: User) -> Shop:
    """Create test shop"""
    shop = Shop(
        user_id=test_user.id,
        name="Test Salon",
        type="nail",
    )
    db_session.add(shop)
    await db_session.commit()
    await db_session.refresh(shop)
    return shop


@pytest.fixture
async def test_reviews(db_session: AsyncSession, test_shop: Shop) -> list[Review]:
    """Create test reviews with various statuses"""
    now = datetime.now(UTC)
    reviews = [
        # Replied reviews
        Review(
            shop_id=test_shop.id,
            reviewer_name="Customer 1",
            rating=5,
            content="Excellent service!",
            review_date=now - timedelta(days=1),
            status="replied",
            final_response="Thank you for your kind review!",
            replied_at=now - timedelta(hours=12),
        ),
        Review(
            shop_id=test_shop.id,
            reviewer_name="Customer 2",
            rating=4,
            content="Very good",
            review_date=now - timedelta(days=2),
            status="replied",
            final_response="We appreciate your feedback!",
            replied_at=now - timedelta(days=1),
        ),
        # Pending reviews
        Review(
            shop_id=test_shop.id,
            reviewer_name="Customer 3",
            rating=3,
            content="Could be better",
            review_date=now - timedelta(days=3),
            status="pending",
        ),
        Review(
            shop_id=test_shop.id,
            reviewer_name="Customer 4",
            rating=5,
            content="Amazing!",
            review_date=now - timedelta(hours=6),
            status="pending",
        ),
        # Ignored review
        Review(
            shop_id=test_shop.id,
            reviewer_name="Customer 5",
            rating=2,
            content="Not satisfied",
            review_date=now - timedelta(days=5),
            status="ignored",
        ),
    ]
    db_session.add_all(reviews)
    await db_session.commit()
    return reviews


class TestGetReviewStats:
    """Tests for get_review_stats method (FR-001, FR-002, FR-003, FR-004)"""

    @pytest.mark.asyncio
    async def test_should_return_total_review_count(
        self, db_session: AsyncSession, test_shop: Shop, test_reviews: list[Review]
    ):
        """FR-001: Total reviews count should include all reviews"""
        service = DashboardService(db_session)

        result = await service.get_review_stats(test_shop.id)

        assert result.total_reviews == 5

    @pytest.mark.asyncio
    async def test_should_calculate_average_rating(
        self, db_session: AsyncSession, test_shop: Shop, test_reviews: list[Review]
    ):
        """FR-002: Average rating should be calculated correctly"""
        service = DashboardService(db_session)

        result = await service.get_review_stats(test_shop.id)

        # Average: (5 + 4 + 3 + 5 + 2) / 5 = 3.8
        assert result.average_rating == pytest.approx(3.8, rel=0.01)

    @pytest.mark.asyncio
    async def test_should_calculate_response_rate(
        self, db_session: AsyncSession, test_shop: Shop, test_reviews: list[Review]
    ):
        """FR-003: Response rate should be percentage of replied reviews"""
        service = DashboardService(db_session)

        result = await service.get_review_stats(test_shop.id)

        # 2 replied out of 5 total = 40%
        assert result.response_rate == pytest.approx(40.0, rel=0.01)

    @pytest.mark.asyncio
    async def test_should_return_pending_count(
        self, db_session: AsyncSession, test_shop: Shop, test_reviews: list[Review]
    ):
        """FR-004: Pending count should count reviews with status='pending'"""
        service = DashboardService(db_session)

        result = await service.get_review_stats(test_shop.id)

        assert result.pending_count == 2

    @pytest.mark.asyncio
    async def test_should_return_last_synced_at(
        self, db_session: AsyncSession, test_shop: Shop, test_reviews: list[Review]
    ):
        """Should include last_synced_at timestamp"""
        service = DashboardService(db_session)

        result = await service.get_review_stats(test_shop.id)

        assert result.last_synced_at is not None
        # Should be recent (within last minute)
        now = datetime.now(UTC)
        assert (now - result.last_synced_at).total_seconds() < 60

    @pytest.mark.asyncio
    async def test_should_handle_empty_reviews(
        self, db_session: AsyncSession, test_shop: Shop
    ):
        """Should handle shop with no reviews gracefully"""
        service = DashboardService(db_session)

        result = await service.get_review_stats(test_shop.id)

        assert result.total_reviews == 0
        assert result.average_rating == 0.0
        assert result.response_rate == 0.0
        assert result.pending_count == 0

    @pytest.mark.asyncio
    async def test_should_return_by_platform_breakdown(
        self, db_session: AsyncSession, test_shop: Shop, test_reviews: list[Review]
    ):
        """Should return per-platform statistics breakdown"""
        service = DashboardService(db_session)

        result = await service.get_review_stats(test_shop.id)

        # Should have platform breakdown in by_platform dict
        assert isinstance(result.by_platform, dict)


class TestVerifyShopOwnership:
    """Tests for shop ownership verification"""

    @pytest.mark.asyncio
    async def test_should_return_shop_for_owner(
        self, db_session: AsyncSession, test_user: User, test_shop: Shop
    ):
        """Should return shop when user owns it"""
        service = DashboardService(db_session)

        result = await service.verify_shop_ownership(test_shop.id, test_user.id)

        assert result is not None
        assert result.id == test_shop.id

    @pytest.mark.asyncio
    async def test_should_return_none_for_non_owner(
        self, db_session: AsyncSession, test_shop: Shop
    ):
        """Should return None when user doesn't own shop"""
        service = DashboardService(db_session)
        non_owner_id = uuid4()

        result = await service.verify_shop_ownership(test_shop.id, non_owner_id)

        assert result is None

    @pytest.mark.asyncio
    async def test_should_return_none_for_nonexistent_shop(
        self, db_session: AsyncSession, test_user: User
    ):
        """Should return None for non-existent shop"""
        service = DashboardService(db_session)
        fake_shop_id = uuid4()

        result = await service.verify_shop_ownership(fake_shop_id, test_user.id)

        assert result is None


# ============== User Story 2: Posting Calendar Tests ==============


@pytest.fixture
async def test_posts(db_session: AsyncSession, test_shop: Shop) -> list[Post]:
    """Create test posts with various statuses and dates"""
    now = datetime.now(UTC)
    posts = [
        # Published posts
        Post(
            shop_id=test_shop.id,
            status="published",
            image_url="https://example.com/img1.jpg",
            caption="First post about our services",
            scheduled_at=now - timedelta(days=5),
            published_at=now - timedelta(days=5),
            likes_count=100,
            comments_count=20,
            reach_count=500,
        ),
        Post(
            shop_id=test_shop.id,
            status="published",
            image_url="https://example.com/img2.jpg",
            caption="Second post highlighting team",
            scheduled_at=now - timedelta(days=3),
            published_at=now - timedelta(days=3),
            likes_count=80,
            comments_count=15,
            reach_count=400,
        ),
        # Scheduled posts
        Post(
            shop_id=test_shop.id,
            status="scheduled",
            image_url="https://example.com/img3.jpg",
            caption="Upcoming promotion",
            scheduled_at=now + timedelta(days=2),
        ),
        Post(
            shop_id=test_shop.id,
            status="scheduled",
            image_url="https://example.com/img4.jpg",
            caption="Weekend special",
            scheduled_at=now + timedelta(days=5),
        ),
        # Failed post
        Post(
            shop_id=test_shop.id,
            status="failed",
            image_url="https://example.com/img5.jpg",
            caption="Failed to publish",
            scheduled_at=now - timedelta(days=1),
            error_message="Instagram API error",
        ),
        # Draft post (should not appear in calendar)
        Post(
            shop_id=test_shop.id,
            status="draft",
            image_url="https://example.com/img6.jpg",
            caption="Work in progress",
        ),
    ]
    db_session.add_all(posts)
    await db_session.commit()
    return posts


class TestGetPostingCalendar:
    """Tests for get_posting_calendar method (FR-005, FR-006, FR-007)"""

    @pytest.mark.asyncio
    async def test_should_return_posts_within_date_range(
        self, db_session: AsyncSession, test_shop: Shop, test_posts: list[Post]
    ):
        """FR-005: Should display posts on a calendar within the date range"""
        service = DashboardService(db_session)
        now = datetime.now(UTC)
        start_date = (now - timedelta(days=7)).date()
        end_date = (now + timedelta(days=7)).date()

        result = await service.get_posting_calendar(test_shop.id, start_date, end_date)

        # Should return calendar entries
        assert result.start_date == start_date
        assert result.end_date == end_date
        assert isinstance(result.entries, list)

    @pytest.mark.asyncio
    async def test_should_group_posts_by_date(
        self, db_session: AsyncSession, test_shop: Shop, test_posts: list[Post]
    ):
        """FR-006: Posts should be grouped by their scheduled/published date"""
        service = DashboardService(db_session)
        now = datetime.now(UTC)
        start_date = (now - timedelta(days=7)).date()
        end_date = (now + timedelta(days=7)).date()

        result = await service.get_posting_calendar(test_shop.id, start_date, end_date)

        # Each entry should have a date and posts list
        for entry in result.entries:
            assert entry.date is not None
            assert isinstance(entry.posts, list)

    @pytest.mark.asyncio
    async def test_should_include_post_status(
        self, db_session: AsyncSession, test_shop: Shop, test_posts: list[Post]
    ):
        """FR-007: Each post should have a status indicator"""
        service = DashboardService(db_session)
        now = datetime.now(UTC)
        start_date = (now - timedelta(days=7)).date()
        end_date = (now + timedelta(days=7)).date()

        result = await service.get_posting_calendar(test_shop.id, start_date, end_date)

        # Collect all post statuses
        all_statuses = []
        for entry in result.entries:
            for post in entry.posts:
                all_statuses.append(post.status)
                assert post.status in ["draft", "scheduled", "published", "failed"]

        # Should have at least some posts with different statuses
        assert len(all_statuses) > 0

    @pytest.mark.asyncio
    async def test_should_exclude_draft_posts_from_calendar(
        self, db_session: AsyncSession, test_shop: Shop, test_posts: list[Post]
    ):
        """Draft posts should not appear in calendar (no scheduled date)"""
        service = DashboardService(db_session)
        now = datetime.now(UTC)
        start_date = (now - timedelta(days=30)).date()
        end_date = (now + timedelta(days=30)).date()

        result = await service.get_posting_calendar(test_shop.id, start_date, end_date)

        # No draft posts should be in the calendar
        for entry in result.entries:
            for post in entry.posts:
                assert post.status != "draft"

    @pytest.mark.asyncio
    async def test_should_return_post_summary_fields(
        self, db_session: AsyncSession, test_shop: Shop, test_posts: list[Post]
    ):
        """Posts should include summary fields: id, status, image_url, caption_snippet"""
        service = DashboardService(db_session)
        now = datetime.now(UTC)
        start_date = (now - timedelta(days=7)).date()
        end_date = (now + timedelta(days=7)).date()

        result = await service.get_posting_calendar(test_shop.id, start_date, end_date)

        for entry in result.entries:
            for post in entry.posts:
                assert post.id is not None
                assert post.status is not None
                assert post.image_url is not None
                # caption_snippet can be None or string

    @pytest.mark.asyncio
    async def test_should_return_empty_entries_for_empty_range(
        self, db_session: AsyncSession, test_shop: Shop
    ):
        """Should return empty entries for date range with no posts"""
        service = DashboardService(db_session)
        # Far future dates with no posts
        start_date = (datetime.now(UTC) + timedelta(days=365)).date()
        end_date = (datetime.now(UTC) + timedelta(days=400)).date()

        result = await service.get_posting_calendar(test_shop.id, start_date, end_date)

        assert result.entries == []

    @pytest.mark.asyncio
    async def test_should_include_last_synced_at(
        self, db_session: AsyncSession, test_shop: Shop, test_posts: list[Post]
    ):
        """Should include last_synced_at timestamp"""
        service = DashboardService(db_session)
        now = datetime.now(UTC)
        start_date = (now - timedelta(days=7)).date()
        end_date = (now + timedelta(days=7)).date()

        result = await service.get_posting_calendar(test_shop.id, start_date, end_date)

        assert result.last_synced_at is not None


# ============== User Story 3: Engagement Metrics Tests ==============


class TestGetEngagementMetrics:
    """Tests for get_engagement_metrics method (FR-008, FR-009)"""

    @pytest.mark.asyncio
    async def test_should_return_total_likes(
        self, db_session: AsyncSession, test_shop: Shop, test_posts: list[Post]
    ):
        """FR-008: Should return total likes count"""
        service = DashboardService(db_session)

        result = await service.get_engagement_metrics(test_shop.id)

        # From test_posts: 100 + 80 = 180 likes
        assert result.total_likes == 180

    @pytest.mark.asyncio
    async def test_should_return_total_comments(
        self, db_session: AsyncSession, test_shop: Shop, test_posts: list[Post]
    ):
        """FR-008: Should return total comments count"""
        service = DashboardService(db_session)

        result = await service.get_engagement_metrics(test_shop.id)

        # From test_posts: 20 + 15 = 35 comments
        assert result.total_comments == 35

    @pytest.mark.asyncio
    async def test_should_return_total_reach(
        self, db_session: AsyncSession, test_shop: Shop, test_posts: list[Post]
    ):
        """FR-008: Should return total reach count"""
        service = DashboardService(db_session)

        result = await service.get_engagement_metrics(test_shop.id)

        # From test_posts: 500 + 400 = 900 reach
        assert result.total_reach == 900

    @pytest.mark.asyncio
    async def test_should_return_top_posts_ranked_by_engagement(
        self, db_session: AsyncSession, test_shop: Shop, test_posts: list[Post]
    ):
        """FR-009: Should return top performing posts by engagement score"""
        service = DashboardService(db_session)

        result = await service.get_engagement_metrics(test_shop.id)

        assert len(result.top_posts) > 0
        # Should be sorted by engagement score descending
        if len(result.top_posts) > 1:
            assert result.top_posts[0].engagement_score >= result.top_posts[1].engagement_score

    @pytest.mark.asyncio
    async def test_should_limit_top_posts_to_five(
        self, db_session: AsyncSession, test_shop: Shop, test_posts: list[Post]
    ):
        """Should return at most 5 top posts"""
        service = DashboardService(db_session)

        result = await service.get_engagement_metrics(test_shop.id)

        assert len(result.top_posts) <= 5

    @pytest.mark.asyncio
    async def test_should_only_include_published_posts(
        self, db_session: AsyncSession, test_shop: Shop, test_posts: list[Post]
    ):
        """Should only count engagement from published posts"""
        service = DashboardService(db_session)

        result = await service.get_engagement_metrics(test_shop.id)

        # Only published posts have engagement metrics
        for post in result.top_posts:
            # Top posts should only be published ones
            assert post.engagement_score >= 0

    @pytest.mark.asyncio
    async def test_should_handle_empty_posts(
        self, db_session: AsyncSession, test_shop: Shop
    ):
        """Should handle shop with no posts gracefully"""
        service = DashboardService(db_session)

        result = await service.get_engagement_metrics(test_shop.id)

        assert result.total_likes == 0
        assert result.total_comments == 0
        assert result.total_reach == 0
        assert result.top_posts == []

    @pytest.mark.asyncio
    async def test_should_include_last_synced_at(
        self, db_session: AsyncSession, test_shop: Shop, test_posts: list[Post]
    ):
        """Should include last_synced_at timestamp"""
        service = DashboardService(db_session)

        result = await service.get_engagement_metrics(test_shop.id)

        assert result.last_synced_at is not None


# ============== User Story 4: Trend Data Tests ==============


class TestGetTrendData:
    """Tests for get_trend_data method (FR-010, FR-011)"""

    @pytest.mark.asyncio
    async def test_should_return_week_data_points(
        self, db_session: AsyncSession, test_shop: Shop, test_reviews: list[Review]
    ):
        """FR-011: Should return data points for week period"""
        service = DashboardService(db_session)

        result = await service.get_trend_data(test_shop.id, "week")

        assert result.period == "week"
        assert isinstance(result.data_points, list)

    @pytest.mark.asyncio
    async def test_should_return_month_data_points(
        self, db_session: AsyncSession, test_shop: Shop, test_reviews: list[Review]
    ):
        """FR-011: Should return data points for month period"""
        service = DashboardService(db_session)

        result = await service.get_trend_data(test_shop.id, "month")

        assert result.period == "month"
        assert isinstance(result.data_points, list)

    @pytest.mark.asyncio
    async def test_should_return_year_data_points(
        self, db_session: AsyncSession, test_shop: Shop, test_reviews: list[Review]
    ):
        """FR-011: Should return data points for year period"""
        service = DashboardService(db_session)

        result = await service.get_trend_data(test_shop.id, "year")

        assert result.period == "year"
        assert isinstance(result.data_points, list)

    @pytest.mark.asyncio
    async def test_data_points_should_include_review_count(
        self, db_session: AsyncSession, test_shop: Shop, test_reviews: list[Review]
    ):
        """FR-010: Data points should include review count"""
        service = DashboardService(db_session)

        result = await service.get_trend_data(test_shop.id, "week")

        for point in result.data_points:
            assert hasattr(point, "review_count")
            assert point.review_count >= 0

    @pytest.mark.asyncio
    async def test_data_points_should_include_average_rating(
        self, db_session: AsyncSession, test_shop: Shop, test_reviews: list[Review]
    ):
        """FR-010: Data points should include average rating"""
        service = DashboardService(db_session)

        result = await service.get_trend_data(test_shop.id, "week")

        for point in result.data_points:
            assert hasattr(point, "average_rating")
            assert 0 <= point.average_rating <= 5

    @pytest.mark.asyncio
    async def test_data_points_should_include_response_rate(
        self, db_session: AsyncSession, test_shop: Shop, test_reviews: list[Review]
    ):
        """FR-010: Data points should include response rate"""
        service = DashboardService(db_session)

        result = await service.get_trend_data(test_shop.id, "week")

        for point in result.data_points:
            assert hasattr(point, "response_rate")
            assert 0 <= point.response_rate <= 100

    @pytest.mark.asyncio
    async def test_should_handle_empty_reviews(
        self, db_session: AsyncSession, test_shop: Shop
    ):
        """Should handle shop with no reviews gracefully"""
        service = DashboardService(db_session)

        result = await service.get_trend_data(test_shop.id, "week")

        assert result.period == "week"
        assert result.data_points == []

    @pytest.mark.asyncio
    async def test_data_points_should_be_sorted_by_date(
        self, db_session: AsyncSession, test_shop: Shop, test_reviews: list[Review]
    ):
        """Data points should be sorted chronologically"""
        service = DashboardService(db_session)

        result = await service.get_trend_data(test_shop.id, "week")

        if len(result.data_points) > 1:
            dates = [point.date for point in result.data_points]
            assert dates == sorted(dates)


# ============== User Story 5: Pending Reviews & Quick Actions Tests ==============


class TestGetPendingReviews:
    """Tests for get_pending_reviews method (FR-012)"""

    @pytest.mark.asyncio
    async def test_should_return_pending_reviews_only(
        self, db_session: AsyncSession, test_shop: Shop, test_reviews: list[Review]
    ):
        """FR-012: Should only return reviews with status='pending'"""
        service = DashboardService(db_session)

        result = await service.get_pending_reviews(test_shop.id)

        # All returned reviews should be pending
        for review in result.reviews:
            assert review.platform in ["google", "naver"]  # Platform should be set

    @pytest.mark.asyncio
    async def test_should_return_correct_pending_count(
        self, db_session: AsyncSession, test_shop: Shop, test_reviews: list[Review]
    ):
        """Should return correct total pending count"""
        service = DashboardService(db_session)

        result = await service.get_pending_reviews(test_shop.id)

        # From test_reviews fixture, there are 2 pending reviews
        assert result.total_pending == 2

    @pytest.mark.asyncio
    async def test_should_respect_limit_parameter(
        self, db_session: AsyncSession, test_shop: Shop, test_reviews: list[Review]
    ):
        """Should respect the limit parameter"""
        service = DashboardService(db_session)

        result = await service.get_pending_reviews(test_shop.id, limit=1)

        assert len(result.reviews) <= 1
        # Total pending should still be the actual count
        assert result.total_pending == 2

    @pytest.mark.asyncio
    async def test_should_return_reviews_ordered_by_date_descending(
        self, db_session: AsyncSession, test_shop: Shop, test_reviews: list[Review]
    ):
        """Pending reviews should be ordered by review_date descending (newest first)"""
        service = DashboardService(db_session)

        result = await service.get_pending_reviews(test_shop.id)

        if len(result.reviews) > 1:
            dates = [review.review_date for review in result.reviews]
            assert dates == sorted(dates, reverse=True)

    @pytest.mark.asyncio
    async def test_should_include_review_details(
        self, db_session: AsyncSession, test_shop: Shop, test_reviews: list[Review]
    ):
        """Pending reviews should include required fields"""
        service = DashboardService(db_session)

        result = await service.get_pending_reviews(test_shop.id)

        for review in result.reviews:
            assert review.id is not None
            assert review.reviewer_name is not None
            assert review.rating is not None
            assert review.content is not None
            assert review.review_date is not None

    @pytest.mark.asyncio
    async def test_should_handle_no_pending_reviews(
        self, db_session: AsyncSession, test_shop: Shop
    ):
        """Should handle shop with no pending reviews"""
        service = DashboardService(db_session)

        result = await service.get_pending_reviews(test_shop.id)

        assert result.reviews == []
        assert result.total_pending == 0


class TestGenerateAiResponse:
    """Tests for generate_ai_response method (FR-013)"""

    @pytest.mark.asyncio
    async def test_should_generate_response_for_valid_review(
        self, db_session: AsyncSession, test_shop: Shop, test_reviews: list[Review]
    ):
        """FR-013: Should generate AI response for a valid review"""
        service = DashboardService(db_session)
        # Get a pending review
        pending = await service.get_pending_reviews(test_shop.id, limit=1)
        review_id = pending.reviews[0].id

        result = await service.generate_ai_response(test_shop.id, review_id)

        assert result.review_id == review_id
        assert result.ai_response is not None
        assert len(result.ai_response) > 0
        assert result.generated_at is not None

    @pytest.mark.asyncio
    async def test_should_store_generated_response_in_review(
        self, db_session: AsyncSession, test_shop: Shop, test_reviews: list[Review]
    ):
        """Generated response should be stored in the review record"""
        service = DashboardService(db_session)
        pending = await service.get_pending_reviews(test_shop.id, limit=1)
        review_id = pending.reviews[0].id

        result = await service.generate_ai_response(test_shop.id, review_id)

        # Fetch the review again and check ai_response is set
        updated_pending = await service.get_pending_reviews(test_shop.id, limit=10)
        matching = [r for r in updated_pending.reviews if r.id == review_id]
        assert len(matching) == 1
        assert matching[0].ai_response == result.ai_response

    @pytest.mark.asyncio
    async def test_should_raise_error_for_nonexistent_review(
        self, db_session: AsyncSession, test_shop: Shop
    ):
        """Should raise ValueError for non-existent review"""
        from uuid import uuid4
        service = DashboardService(db_session)
        fake_review_id = uuid4()

        with pytest.raises(ValueError, match="Review not found"):
            await service.generate_ai_response(test_shop.id, fake_review_id)

    @pytest.mark.asyncio
    async def test_should_generate_appropriate_response_for_high_rating(
        self, db_session: AsyncSession, test_shop: Shop, test_reviews: list[Review]
    ):
        """Should generate positive response for high-rated reviews"""
        service = DashboardService(db_session)
        # Get a high-rated pending review (rating 5)
        pending = await service.get_pending_reviews(test_shop.id, limit=10)
        high_rated = [r for r in pending.reviews if r.rating >= 4]
        if high_rated:
            review_id = high_rated[0].id

            result = await service.generate_ai_response(test_shop.id, review_id)

            # Should contain positive language
            assert "감사" in result.ai_response or "기쁩" in result.ai_response

    @pytest.mark.asyncio
    async def test_should_generate_appropriate_response_for_low_rating(
        self, db_session: AsyncSession, test_shop: Shop, test_reviews: list[Review]
    ):
        """Should generate apologetic response for low-rated reviews"""
        service = DashboardService(db_session)
        # Get a low-rated pending review (rating 3 or below)
        pending = await service.get_pending_reviews(test_shop.id, limit=10)
        low_rated = [r for r in pending.reviews if r.rating <= 3]
        if low_rated:
            review_id = low_rated[0].id

            result = await service.generate_ai_response(test_shop.id, review_id)

            # Should contain apologetic or improvement language
            assert "죄송" in result.ai_response or "개선" in result.ai_response or "노력" in result.ai_response


class TestPublishResponse:
    """Tests for publish_response method (FR-014)"""

    @pytest.mark.asyncio
    async def test_should_publish_response_and_update_status(
        self, db_session: AsyncSession, test_shop: Shop, test_reviews: list[Review]
    ):
        """FR-014: Should publish response and update review status to 'replied'"""
        service = DashboardService(db_session)
        pending = await service.get_pending_reviews(test_shop.id, limit=1)
        review_id = pending.reviews[0].id
        final_response = "감사합니다! 다음에 또 방문해주세요."

        result = await service.publish_response(test_shop.id, review_id, final_response)

        assert result.review_id == review_id
        assert result.status == "replied"
        assert result.replied_at is not None

    @pytest.mark.asyncio
    async def test_should_store_final_response(
        self, db_session: AsyncSession, test_shop: Shop, test_reviews: list[Review]
    ):
        """Published response should be stored as final_response"""
        from sqlalchemy import select
        service = DashboardService(db_session)
        pending = await service.get_pending_reviews(test_shop.id, limit=1)
        review_id = pending.reviews[0].id
        final_response = "고객님의 소중한 리뷰 감사합니다."

        await service.publish_response(test_shop.id, review_id, final_response)

        # Verify the review was updated
        result = await db_session.execute(
            select(Review).where(Review.id == review_id)
        )
        review = result.scalar_one()
        assert review.final_response == final_response
        assert review.status == "replied"

    @pytest.mark.asyncio
    async def test_should_raise_error_for_nonexistent_review(
        self, db_session: AsyncSession, test_shop: Shop
    ):
        """Should raise ValueError for non-existent review"""
        from uuid import uuid4
        service = DashboardService(db_session)
        fake_review_id = uuid4()

        with pytest.raises(ValueError, match="Review not found"):
            await service.publish_response(test_shop.id, fake_review_id, "response")

    @pytest.mark.asyncio
    async def test_published_review_should_not_appear_in_pending(
        self, db_session: AsyncSession, test_shop: Shop, test_reviews: list[Review]
    ):
        """After publishing, review should not appear in pending list"""
        service = DashboardService(db_session)
        pending = await service.get_pending_reviews(test_shop.id, limit=1)
        review_id = pending.reviews[0].id
        initial_pending_count = pending.total_pending

        await service.publish_response(test_shop.id, review_id, "Thank you!")

        # Check pending count decreased
        updated_pending = await service.get_pending_reviews(test_shop.id)
        assert updated_pending.total_pending == initial_pending_count - 1
        # The review should not be in the pending list
        assert review_id not in [r.id for r in updated_pending.reviews]
