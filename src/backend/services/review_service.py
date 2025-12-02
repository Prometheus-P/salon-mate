"""
리뷰 서비스
리뷰 CRUD 및 통계 비즈니스 로직
"""

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
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

    async def get_review_stats(self, user: User, shop_id: UUID) -> dict:
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
