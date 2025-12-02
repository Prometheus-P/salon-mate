"""
Dashboard Service - Business logic for marketing dashboard
"""

import logging
from datetime import UTC, date, datetime, timedelta
from uuid import UUID

from sqlalchemy import and_, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.post import Post
from models.review import Review
from models.shop import Shop
from schemas.dashboard import (
    CalendarEntry,
    CalendarResponse,
    EngagementResponse,
    GeneratedResponseResult,
    PendingReview,
    PendingReviewsResponse,
    PlatformStats,
    PostSummary,
    PublishResponseResult,
    ReviewStatsResponse,
    ShopsListResponse,
    ShopSummary,
    TopPost,
    TrendDataPoint,
    TrendResponse,
)

logger = logging.getLogger(__name__)


class DashboardService:
    """Service for dashboard-related operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def verify_shop_ownership(self, shop_id: UUID, user_id: UUID) -> Shop | None:
        """Verify that the user owns the shop"""
        logger.debug(
            "Verifying shop ownership",
            extra={"shop_id": str(shop_id), "user_id": str(user_id)},
        )
        result = await self.db.execute(
            select(Shop).where(and_(Shop.id == shop_id, Shop.user_id == user_id))
        )
        shop = result.scalar_one_or_none()
        if not shop:
            logger.warning(
                "Shop ownership verification failed",
                extra={"shop_id": str(shop_id), "user_id": str(user_id)},
            )
        return shop

    # ============== User Story 1: Review Stats ==============

    async def get_review_stats(self, shop_id: UUID) -> ReviewStatsResponse:
        """
        Get review statistics for a shop.
        Implements FR-001, FR-002, FR-003, FR-004.
        """
        logger.info("Fetching review stats", extra={"shop_id": str(shop_id)})
        # Get all reviews for the shop
        result = await self.db.execute(
            select(
                func.count(Review.id).label("total_reviews"),
                func.coalesce(func.avg(Review.rating), 0).label("average_rating"),
                func.sum(case((Review.status == "replied", 1), else_=0)).label(
                    "replied_count"
                ),
                func.sum(case((Review.status == "pending", 1), else_=0)).label(
                    "pending_count"
                ),
            ).where(Review.shop_id == shop_id)
        )
        row = result.one()

        total_reviews = row.total_reviews or 0
        average_rating = float(row.average_rating or 0)
        replied_count = int(row.replied_count or 0)
        pending_count = int(row.pending_count or 0)

        # Calculate response rate
        response_rate = 0.0
        if total_reviews > 0:
            response_rate = (replied_count / total_reviews) * 100

        # Get platform breakdown (google vs naver)
        # Reviews with google_review_id are from Google, otherwise assume Naver
        by_platform: dict[str, PlatformStats] = {}

        # Google reviews (have google_review_id)
        google_result = await self.db.execute(
            select(
                func.count(Review.id).label("total"),
                func.coalesce(func.avg(Review.rating), 0).label("avg_rating"),
                func.sum(case((Review.status == "replied", 1), else_=0)).label(
                    "replied"
                ),
            ).where(
                and_(
                    Review.shop_id == shop_id,
                    Review.google_review_id.isnot(None),
                )
            )
        )
        google_row = google_result.one()
        if google_row.total and google_row.total > 0:
            google_response_rate = (
                int(google_row.replied or 0) / google_row.total
            ) * 100
            by_platform["google"] = PlatformStats(
                total_reviews=google_row.total,
                average_rating=float(google_row.avg_rating or 0),
                response_rate=google_response_rate,
            )

        # Naver reviews (no google_review_id)
        naver_result = await self.db.execute(
            select(
                func.count(Review.id).label("total"),
                func.coalesce(func.avg(Review.rating), 0).label("avg_rating"),
                func.sum(case((Review.status == "replied", 1), else_=0)).label(
                    "replied"
                ),
            ).where(
                and_(
                    Review.shop_id == shop_id,
                    Review.google_review_id.is_(None),
                )
            )
        )
        naver_row = naver_result.one()
        if naver_row.total and naver_row.total > 0:
            naver_response_rate = (int(naver_row.replied or 0) / naver_row.total) * 100
            by_platform["naver"] = PlatformStats(
                total_reviews=naver_row.total,
                average_rating=float(naver_row.avg_rating or 0),
                response_rate=naver_response_rate,
            )

        return ReviewStatsResponse(
            total_reviews=total_reviews,
            average_rating=round(average_rating, 2),
            response_rate=round(response_rate, 2),
            pending_count=pending_count,
            by_platform=by_platform,
            last_synced_at=datetime.now(UTC),
        )

    # ============== User Story 2: Posting Calendar ==============

    async def get_posting_calendar(
        self,
        shop_id: UUID,
        start_date: date,
        end_date: date,
    ) -> CalendarResponse:
        """
        Get posting calendar entries for a date range.
        Implements FR-005, FR-006, FR-007.
        """
        logger.info(
            "Fetching posting calendar",
            extra={
                "shop_id": str(shop_id),
                "start_date": str(start_date),
                "end_date": str(end_date),
            },
        )
        from sqlalchemy import or_

        # Query posts that fall within the date range
        # Posts are grouped by their display date (scheduled_at or published_at)
        # Exclude draft posts (they have no scheduled_at)
        result = await self.db.execute(
            select(Post)
            .where(
                and_(
                    Post.shop_id == shop_id,
                    Post.status != "draft",  # Exclude drafts
                    or_(
                        # Check scheduled_at is within range
                        and_(
                            Post.scheduled_at.isnot(None),
                            func.date(Post.scheduled_at) >= start_date,
                            func.date(Post.scheduled_at) <= end_date,
                        ),
                        # Check published_at is within range (for published posts without scheduled_at)
                        and_(
                            Post.scheduled_at.is_(None),
                            Post.published_at.isnot(None),
                            func.date(Post.published_at) >= start_date,
                            func.date(Post.published_at) <= end_date,
                        ),
                    ),
                )
            )
            .order_by(Post.scheduled_at, Post.published_at)
        )
        posts = result.scalars().all()

        # Group posts by date
        posts_by_date: dict[date, list[PostSummary]] = {}

        for post in posts:
            # Determine the display date (prefer scheduled_at, fallback to published_at)
            display_datetime = post.scheduled_at or post.published_at
            if display_datetime is None:
                continue

            display_date = display_datetime.date()

            if display_date not in posts_by_date:
                posts_by_date[display_date] = []

            # Create caption snippet (first 50 chars)
            caption_snippet = None
            if post.caption:
                caption_snippet = post.caption[:50] + (
                    "..." if len(post.caption) > 50 else ""
                )

            posts_by_date[display_date].append(
                PostSummary(
                    id=post.id,
                    status=post.status,
                    image_url=post.image_url,
                    caption_snippet=caption_snippet,
                    scheduled_at=post.scheduled_at,
                    published_at=post.published_at,
                )
            )

        # Convert to CalendarEntry list, sorted by date
        entries = [
            CalendarEntry(date=d, posts=p) for d, p in sorted(posts_by_date.items())
        ]

        return CalendarResponse(
            start_date=start_date,
            end_date=end_date,
            entries=entries,
            last_synced_at=datetime.now(UTC),
        )

    # ============== User Story 3: Engagement Metrics ==============

    async def get_engagement_metrics(self, shop_id: UUID) -> EngagementResponse:
        """
        Get engagement metrics summary.
        Implements FR-008, FR-009.
        """
        logger.info("Fetching engagement metrics", extra={"shop_id": str(shop_id)})
        # Get totals from published posts only
        result = await self.db.execute(
            select(
                func.coalesce(func.sum(Post.likes_count), 0).label("total_likes"),
                func.coalesce(func.sum(Post.comments_count), 0).label("total_comments"),
                func.coalesce(func.sum(Post.reach_count), 0).label("total_reach"),
            ).where(
                and_(
                    Post.shop_id == shop_id,
                    Post.status == "published",
                )
            )
        )
        row = result.one()

        total_likes = int(row.total_likes)
        total_comments = int(row.total_comments)
        total_reach = int(row.total_reach)

        # Get top 5 posts by engagement score
        # Engagement score = likes + comments*2 + reach/10
        posts_result = await self.db.execute(
            select(Post)
            .where(
                and_(
                    Post.shop_id == shop_id,
                    Post.status == "published",
                )
            )
            .order_by(
                # Order by engagement score descending
                (
                    Post.likes_count + Post.comments_count * 2 + Post.reach_count / 10
                ).desc()
            )
            .limit(5)
        )
        top_posts_models = posts_result.scalars().all()

        top_posts = [
            TopPost(
                id=post.id,
                image_url=post.image_url,
                likes_count=post.likes_count,
                comments_count=post.comments_count,
                reach_count=post.reach_count,
                engagement_score=post.likes_count
                + (post.comments_count * 2)
                + (post.reach_count // 10),
            )
            for post in top_posts_models
        ]

        return EngagementResponse(
            total_likes=total_likes,
            total_comments=total_comments,
            total_reach=total_reach,
            top_posts=top_posts,
            last_synced_at=datetime.now(UTC),
        )

    # ============== User Story 4: Trend Data ==============

    async def get_trend_data(
        self,
        shop_id: UUID,
        period: str,
    ) -> TrendResponse:
        """
        Get trend data for charts.
        Implements FR-010, FR-011.
        """
        logger.info(
            "Fetching trend data", extra={"shop_id": str(shop_id), "period": period}
        )
        # Determine date range based on period
        now = datetime.now(UTC)

        if period == "week":
            start_date = (now - timedelta(days=7)).date()
        elif period == "month":
            start_date = (now - timedelta(days=30)).date()
        else:  # year
            start_date = (now - timedelta(days=365)).date()

        end_date = now.date()

        # Query reviews grouped by date
        result = await self.db.execute(
            select(
                func.date(Review.review_date).label("date"),
                func.count(Review.id).label("review_count"),
                func.coalesce(func.avg(Review.rating), 0).label("average_rating"),
                func.sum(case((Review.status == "replied", 1), else_=0)).label(
                    "replied_count"
                ),
            )
            .where(
                and_(
                    Review.shop_id == shop_id,
                    func.date(Review.review_date) >= start_date,
                    func.date(Review.review_date) <= end_date,
                )
            )
            .group_by(func.date(Review.review_date))
            .order_by(func.date(Review.review_date))
        )
        rows = result.all()

        data_points = []
        for row in rows:
            review_count = row.review_count or 0
            average_rating = float(row.average_rating or 0)
            replied_count = int(row.replied_count or 0)

            response_rate = 0.0
            if review_count > 0:
                response_rate = (replied_count / review_count) * 100

            data_points.append(
                TrendDataPoint(
                    date=row.date,
                    review_count=review_count,
                    average_rating=round(average_rating, 2),
                    response_rate=round(response_rate, 2),
                )
            )

        return TrendResponse(
            period=period,
            data_points=data_points,
        )

    # ============== User Story 5: Pending Reviews & Quick Actions ==============

    async def get_pending_reviews(
        self,
        shop_id: UUID,
        limit: int = 10,
    ) -> PendingReviewsResponse:
        """
        Get pending reviews requiring response.
        Implements FR-012.
        """
        logger.info(
            "Fetching pending reviews", extra={"shop_id": str(shop_id), "limit": limit}
        )
        # Get pending reviews for the shop
        result = await self.db.execute(
            select(Review)
            .where(
                and_(
                    Review.shop_id == shop_id,
                    Review.status == "pending",
                )
            )
            .order_by(Review.review_date.desc())
            .limit(limit)
        )
        reviews = result.scalars().all()

        # Get total pending count
        count_result = await self.db.execute(
            select(func.count(Review.id)).where(
                and_(
                    Review.shop_id == shop_id,
                    Review.status == "pending",
                )
            )
        )
        total_pending = count_result.scalar() or 0

        pending_reviews = [
            PendingReview(
                id=review.id,
                reviewer_name=review.reviewer_name,
                reviewer_profile_url=review.reviewer_profile_url,
                rating=review.rating,
                content=review.content,
                review_date=review.review_date,
                platform="google" if review.google_review_id else "naver",
                ai_response=review.ai_response,
            )
            for review in reviews
        ]

        return PendingReviewsResponse(
            reviews=pending_reviews,
            total_pending=total_pending,
        )

    async def generate_ai_response(
        self,
        shop_id: UUID,
        review_id: UUID,
    ) -> GeneratedResponseResult:
        """
        Generate AI response for a review.
        Implements FR-013.
        """
        logger.info(
            "Generating AI response",
            extra={"shop_id": str(shop_id), "review_id": str(review_id)},
        )
        # Get the review
        result = await self.db.execute(
            select(Review).where(
                and_(
                    Review.id == review_id,
                    Review.shop_id == shop_id,
                )
            )
        )
        review = result.scalar_one_or_none()

        if not review:
            raise ValueError("Review not found")

        # Generate AI response (mock implementation - would integrate with AI service)
        # In production, this would call the AIResponseService
        ai_response = self._generate_mock_ai_response(review)

        # Store the generated response
        review.ai_response = ai_response
        await self.db.commit()

        return GeneratedResponseResult(
            review_id=review_id,
            ai_response=ai_response,
            generated_at=datetime.now(UTC),
        )

    def _generate_mock_ai_response(self, review: Review) -> str:
        """Generate a mock AI response based on review rating"""
        if review.rating >= 4:
            return f"안녕하세요, {review.reviewer_name}님! 소중한 리뷰 감사합니다. 저희 서비스에 만족하셨다니 정말 기쁩니다. 앞으로도 더 좋은 서비스로 보답하겠습니다. 다음 방문도 기대해주세요!"
        elif review.rating >= 3:
            return f"안녕하세요, {review.reviewer_name}님! 리뷰 감사합니다. 더 나은 서비스를 위해 노력하겠습니다. 다음에는 더 만족스러운 경험을 드릴 수 있도록 하겠습니다."
        else:
            return f"안녕하세요, {review.reviewer_name}님. 불편을 드려 죄송합니다. 고객님의 소중한 의견을 바탕으로 서비스 개선에 최선을 다하겠습니다. 다시 한 번 방문해주시면 더 나은 경험을 드리겠습니다."

    async def publish_response(
        self,
        shop_id: UUID,
        review_id: UUID,
        final_response: str,
    ) -> PublishResponseResult:
        """
        Publish approved response to review.
        Implements FR-014.
        """
        logger.info(
            "Publishing review response",
            extra={"shop_id": str(shop_id), "review_id": str(review_id)},
        )
        # Get the review
        result = await self.db.execute(
            select(Review).where(
                and_(
                    Review.id == review_id,
                    Review.shop_id == shop_id,
                )
            )
        )
        review = result.scalar_one_or_none()

        if not review:
            raise ValueError("Review not found")

        # Update review status and response
        review.final_response = final_response
        review.status = "replied"
        review.replied_at = datetime.now(UTC)

        await self.db.commit()

        return PublishResponseResult(
            review_id=review_id,
            status="replied",
            replied_at=review.replied_at,
        )

    # ============== Shop Selector ==============

    async def get_user_shops(self, user_id: UUID) -> ShopsListResponse:
        """
        Get list of shops for the user.
        Implements FR-016.
        """
        logger.info("Fetching user shops", extra={"user_id": str(user_id)})
        result = await self.db.execute(select(Shop).where(Shop.user_id == user_id))
        shops = result.scalars().all()

        shop_summaries = []
        for shop in shops:
            # Check if shop has reviews
            review_count = await self.db.execute(
                select(func.count(Review.id)).where(Review.shop_id == shop.id)
            )
            has_reviews = (review_count.scalar() or 0) > 0

            # Check if shop has posts
            post_count = await self.db.execute(
                select(func.count(Post.id)).where(Post.shop_id == shop.id)
            )
            has_posts = (post_count.scalar() or 0) > 0

            shop_summaries.append(
                ShopSummary(
                    id=shop.id,
                    name=shop.name,
                    type=shop.type,
                    has_reviews=has_reviews,
                    has_posts=has_posts,
                )
            )

        return ShopsListResponse(shops=shop_summaries)
