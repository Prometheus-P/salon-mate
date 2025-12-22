"""
리뷰 서비스
리뷰 CRUD 및 통계 비즈니스 로직
"""

from collections import Counter
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import Date, Integer, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.review import Review
from models.shop import Shop
from models.user import User
from schemas.review import ReviewCreate, ReviewUpdate


class ReviewException(Exception):
    """리뷰 관련 예외"""

    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class ReviewService:
    """리뷰 서비스"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_user_shop(self, user: User, shop_id: UUID) -> Shop | None:
        """사용자의 매장을 조회합니다."""
        result = await self.db.execute(
            select(Shop).where(Shop.id == shop_id).where(Shop.user_id == user.id)
        )
        return result.scalar_one_or_none()

    async def create_review(
        self, user: User, shop_id: UUID, review_data: ReviewCreate
    ) -> Review:
        """새 리뷰를 생성합니다."""
        shop = await self._get_user_shop(user, shop_id)
        if not shop:
            raise ReviewException("매장을 찾을 수 없습니다.", status_code=404)

        review = Review(
            shop_id=shop_id,
            reviewer_name=review_data.reviewer_name,
            reviewer_profile_url=review_data.reviewer_profile_url,
            rating=review_data.rating,
            content=review_data.content,
            review_date=review_data.review_date,
            google_review_id=review_data.google_review_id,
            status="pending",
        )

        self.db.add(review)
        await self.db.commit()
        await self.db.refresh(review)
        return review

    async def get_reviews(
        self,
        user: User,
        shop_id: UUID,
        status: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[Review], int]:
        """매장의 리뷰 목록을 조회합니다."""
        shop = await self._get_user_shop(user, shop_id)
        if not shop:
            raise ReviewException("매장을 찾을 수 없습니다.", status_code=404)

        query = select(Review).where(Review.shop_id == shop_id)

        if status:
            query = query.where(Review.status == status)

        # 총 개수
        count_query = select(func.count()).select_from(query.subquery())
        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0

        # 리뷰 목록
        query = query.order_by(Review.review_date.desc()).offset(offset).limit(limit)
        result = await self.db.execute(query)
        reviews = list(result.scalars().all())

        return reviews, total

    async def get_review_by_id(
        self, user: User, shop_id: UUID, review_id: UUID
    ) -> Review | None:
        """리뷰 ID로 리뷰를 조회합니다."""
        shop = await self._get_user_shop(user, shop_id)
        if not shop:
            return None

        result = await self.db.execute(
            select(Review)
            .where(Review.id == review_id)
            .where(Review.shop_id == shop_id)
        )
        return result.scalar_one_or_none()

    async def update_review(
        self, user: User, shop_id: UUID, review_id: UUID, update_data: ReviewUpdate
    ) -> Review:
        """리뷰 정보를 수정합니다."""
        review = await self.get_review_by_id(user, shop_id, review_id)
        if not review:
            raise ReviewException("리뷰를 찾을 수 없습니다.", status_code=404)

        update_dict = update_data.model_dump(exclude_unset=True, by_alias=False)

        for field, value in update_dict.items():
            if value is not None:
                setattr(review, field, value)

        # replied 상태로 변경 시 replied_at 설정
        if update_data.status == "replied":
            review.replied_at = datetime.now(UTC)

        await self.db.commit()
        await self.db.refresh(review)
        return review

    async def delete_review(self, user: User, shop_id: UUID, review_id: UUID) -> None:
        """리뷰를 삭제합니다."""
        review = await self.get_review_by_id(user, shop_id, review_id)
        if not review:
            raise ReviewException("리뷰를 찾을 수 없습니다.", status_code=404)

        await self.db.delete(review)
        await self.db.commit()

    async def get_review_stats(self, user: User, shop_id: UUID) -> dict[str, Any]:
        """리뷰 통계를 조회합니다."""
        shop = await self._get_user_shop(user, shop_id)
        if not shop:
            raise ReviewException("매장을 찾을 수 없습니다.", status_code=404)

        # 총 리뷰 수와 평균 평점
        stats_result = await self.db.execute(
            select(
                func.count(Review.id),
                func.avg(Review.rating),
            ).where(Review.shop_id == shop_id)
        )
        stats = stats_result.one()
        total_reviews = stats[0] or 0
        average_rating = float(stats[1]) if stats[1] else 0.0

        # 상태별 개수
        status_result = await self.db.execute(
            select(Review.status, func.count(Review.id))
            .where(Review.shop_id == shop_id)
            .group_by(Review.status)
        )
        status_counts = {row[0]: row[1] for row in status_result.all()}

        return {
            "total_reviews": total_reviews,
            "average_rating": round(average_rating, 2),
            "pending_count": status_counts.get("pending", 0),
            "replied_count": status_counts.get("replied", 0),
            "ignored_count": status_counts.get("ignored", 0),
        }

    async def get_analytics(
        self,
        user: User,
        shop_id: UUID,
        period: str = "month",
    ) -> dict[str, Any]:
        """리뷰 분석 데이터를 조회합니다."""
        shop = await self._get_user_shop(user, shop_id)
        if not shop:
            raise ReviewException("매장을 찾을 수 없습니다.", status_code=404)

        # Calculate date ranges
        now = datetime.now(UTC)
        if period == "week":
            current_start = now - timedelta(days=7)
            previous_start = current_start - timedelta(days=7)
        elif period == "year":
            current_start = now - timedelta(days=365)
            previous_start = current_start - timedelta(days=365)
        else:  # month
            current_start = now - timedelta(days=30)
            previous_start = current_start - timedelta(days=30)

        previous_end = current_start

        # Get current period metrics
        current_metrics = await self._get_period_metrics(shop_id, current_start, now)
        previous_metrics = await self._get_period_metrics(
            shop_id, previous_start, previous_end
        )

        # Calculate rating distribution
        rating_distribution = await self._get_rating_distribution(
            shop_id, current_start, now
        )

        # Get trend data (daily)
        trend_data = await self._get_trend_data(shop_id, current_start, now)

        # Get keywords from reviews
        keywords = await self._extract_keywords(shop_id, current_start, now)

        # Calculate sentiment
        sentiment = await self._get_sentiment(shop_id, current_start, now)

        # Calculate change percentages
        def calc_change(current: float, previous: float) -> float:
            if previous == 0:
                return 100.0 if current > 0 else 0.0
            return round(((current - previous) / previous) * 100, 1)

        return {
            "total_reviews": {
                "current": current_metrics["total"],
                "previous": previous_metrics["total"],
                "change_percent": calc_change(
                    current_metrics["total"], previous_metrics["total"]
                ),
            },
            "average_rating": {
                "current": current_metrics["avg_rating"],
                "previous": previous_metrics["avg_rating"],
                "change_percent": calc_change(
                    current_metrics["avg_rating"], previous_metrics["avg_rating"]
                ),
            },
            "response_rate": {
                "current": current_metrics["response_rate"],
                "previous": previous_metrics["response_rate"],
                "change_percent": calc_change(
                    current_metrics["response_rate"], previous_metrics["response_rate"]
                ),
            },
            "rating_distribution": rating_distribution,
            "platform_distribution": [
                {"platform": "google", "count": current_metrics["total"], "percent": 100.0}
            ],  # Single platform for now
            "trend_data": trend_data,
            "keywords": keywords,
            "sentiment": sentiment,
        }

    async def _get_period_metrics(
        self, shop_id: UUID, start: datetime, end: datetime
    ) -> dict[str, Any]:
        """기간별 메트릭을 조회합니다."""
        result = await self.db.execute(
            select(
                func.count(Review.id),
                func.avg(Review.rating),
                func.sum(func.cast(Review.status == "replied", Integer)),
            )
            .where(Review.shop_id == shop_id)
            .where(Review.review_date >= start)
            .where(Review.review_date <= end)
        )
        row = result.one()
        total = row[0] or 0
        avg_rating = float(row[1]) if row[1] else 0.0
        replied = row[2] or 0

        response_rate = (replied / total * 100) if total > 0 else 0.0

        return {
            "total": total,
            "avg_rating": round(avg_rating, 2),
            "response_rate": round(response_rate, 1),
        }

    async def _get_rating_distribution(
        self, shop_id: UUID, start: datetime, end: datetime
    ) -> list[dict[str, Any]]:
        """평점 분포를 조회합니다."""
        result = await self.db.execute(
            select(Review.rating, func.count(Review.id))
            .where(Review.shop_id == shop_id)
            .where(Review.review_date >= start)
            .where(Review.review_date <= end)
            .group_by(Review.rating)
            .order_by(Review.rating.desc())
        )
        rows = result.all()
        total = sum(row[1] for row in rows)

        distribution = []
        for rating in range(5, 0, -1):
            count = next((row[1] for row in rows if row[0] == rating), 0)
            percent = round((count / total * 100), 1) if total > 0 else 0.0
            distribution.append({"rating": rating, "count": count, "percent": percent})

        return distribution

    async def _get_trend_data(
        self, shop_id: UUID, start: datetime, end: datetime
    ) -> list[dict[str, Any]]:
        """일별 트렌드 데이터를 조회합니다."""
        result = await self.db.execute(
            select(
                cast(Review.review_date, Date).label("date"),
                func.count(Review.id),
                func.avg(Review.rating),
            )
            .where(Review.shop_id == shop_id)
            .where(Review.review_date >= start)
            .where(Review.review_date <= end)
            .group_by(cast(Review.review_date, Date))
            .order_by(cast(Review.review_date, Date))
        )
        rows = result.all()

        return [
            {
                "date": row[0].isoformat() if row[0] else "",
                "review_count": row[1] or 0,
                "average_rating": round(float(row[2]), 2) if row[2] else 0.0,
            }
            for row in rows
        ]

    async def _extract_keywords(
        self, shop_id: UUID, start: datetime, end: datetime, top_n: int = 10
    ) -> list[dict[str, Any]]:
        """리뷰에서 키워드를 추출합니다."""
        result = await self.db.execute(
            select(Review.content)
            .where(Review.shop_id == shop_id)
            .where(Review.review_date >= start)
            .where(Review.review_date <= end)
            .where(Review.content.isnot(None))
        )
        contents = [row[0] for row in result.all() if row[0]]

        # Simple Korean keyword extraction
        # Positive keywords commonly found in salon reviews
        positive_keywords = [
            "친절", "만족", "좋", "최고", "추천", "감사", "편안", "깔끔",
            "스타일", "서비스", "분위기", "재방문", "가격", "실력", "전문",
        ]

        word_counts: Counter[str] = Counter()
        for content in contents:
            for keyword in positive_keywords:
                if keyword in content:
                    word_counts[keyword] += content.count(keyword)

        return [
            {"keyword": word, "count": count}
            for word, count in word_counts.most_common(top_n)
        ]

    async def _get_sentiment(
        self, shop_id: UUID, start: datetime, end: datetime
    ) -> dict[str, Any]:
        """감성 분석을 수행합니다."""
        result = await self.db.execute(
            select(Review.rating, func.count(Review.id))
            .where(Review.shop_id == shop_id)
            .where(Review.review_date >= start)
            .where(Review.review_date <= end)
            .group_by(Review.rating)
        )
        rows = {row[0]: row[1] for row in result.all()}

        positive = sum(rows.get(r, 0) for r in [4, 5])
        neutral = rows.get(3, 0)
        negative = sum(rows.get(r, 0) for r in [1, 2])
        total = positive + neutral + negative

        return {
            "positive": positive,
            "neutral": neutral,
            "negative": negative,
            "positive_percent": round((positive / total * 100), 1) if total > 0 else 0.0,
            "neutral_percent": round((neutral / total * 100), 1) if total > 0 else 0.0,
            "negative_percent": round((negative / total * 100), 1) if total > 0 else 0.0,
        }

    async def export_reviews(
        self,
        user: User,
        shop_id: UUID,
        status_filter: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> list[dict[str, Any]]:
        """리뷰 데이터를 내보내기 형식으로 조회합니다."""
        shop = await self._get_user_shop(user, shop_id)
        if not shop:
            raise ReviewException("매장을 찾을 수 없습니다.", status_code=404)

        query = select(Review).where(Review.shop_id == shop_id)

        if status_filter:
            query = query.where(Review.status == status_filter)
        if date_from:
            query = query.where(Review.review_date >= date_from)
        if date_to:
            query = query.where(Review.review_date <= date_to)

        query = query.order_by(Review.review_date.desc())
        result = await self.db.execute(query)
        reviews = result.scalars().all()

        return [
            {
                "id": str(review.id),
                "reviewer_name": review.reviewer_name,
                "rating": review.rating,
                "content": review.content,
                "review_date": review.review_date.isoformat(),
                "status": review.status,
                "platform": "google",  # Single platform for now
                "response": review.final_response,
                "responded_at": review.replied_at.isoformat() if review.replied_at else None,
            }
            for review in reviews
        ]
