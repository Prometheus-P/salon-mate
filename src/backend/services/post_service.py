"""
포스트 서비스
Instagram 포스트 CRUD 및 발행 비즈니스 로직
"""

from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.post import Post
from models.shop import Shop
from models.user import User
from schemas.post import PostCreate, PostUpdate


class PostException(Exception):
    """포스트 관련 예외"""

    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class PostService:
    """포스트 서비스"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_user_shop(self, user: User, shop_id: UUID) -> Shop | None:
        """사용자의 매장을 조회합니다."""
        result = await self.db.execute(
            select(Shop).where(Shop.id == shop_id).where(Shop.user_id == user.id)
        )
        return result.scalar_one_or_none()

    async def create_post(
        self, user: User, shop_id: UUID, post_data: PostCreate
    ) -> Post:
        """새 포스트를 생성합니다."""
        shop = await self._get_user_shop(user, shop_id)
        if not shop:
            raise PostException("매장을 찾을 수 없습니다.", status_code=404)

        status = "scheduled" if post_data.scheduled_at else "draft"

        post = Post(
            shop_id=shop_id,
            image_url=post_data.image_url,
            caption=post_data.caption,
            hashtags=post_data.hashtags,
            scheduled_at=post_data.scheduled_at,
            status=status,
        )

        self.db.add(post)
        await self.db.commit()
        await self.db.refresh(post)
        return post

    async def get_posts(
        self,
        user: User,
        shop_id: UUID,
        status: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[Post], int]:
        """매장의 포스트 목록을 조회합니다."""
        shop = await self._get_user_shop(user, shop_id)
        if not shop:
            raise PostException("매장을 찾을 수 없습니다.", status_code=404)

        query = select(Post).where(Post.shop_id == shop_id)

        if status:
            query = query.where(Post.status == status)

        # 총 개수
        count_query = select(func.count()).select_from(query.subquery())
        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0

        # 포스트 목록 (최신순, 예약된 것은 예약 시간순)
        query = query.order_by(Post.created_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(query)
        posts = list(result.scalars().all())

        return posts, total

    async def get_post_by_id(
        self, user: User, shop_id: UUID, post_id: UUID
    ) -> Post | None:
        """포스트 ID로 포스트를 조회합니다."""
        shop = await self._get_user_shop(user, shop_id)
        if not shop:
            return None

        result = await self.db.execute(
            select(Post).where(Post.id == post_id).where(Post.shop_id == shop_id)
        )
        return result.scalar_one_or_none()

    async def update_post(
        self, user: User, shop_id: UUID, post_id: UUID, update_data: PostUpdate
    ) -> Post:
        """포스트 정보를 수정합니다."""
        post = await self.get_post_by_id(user, shop_id, post_id)
        if not post:
            raise PostException("포스트를 찾을 수 없습니다.", status_code=404)

        if post.status == "published":
            raise PostException("게시된 포스트는 수정할 수 없습니다.", status_code=400)

        update_dict = update_data.model_dump(exclude_unset=True, by_alias=False)

        for field, value in update_dict.items():
            if value is not None:
                setattr(post, field, value)

        # 예약 시간이 설정되면 상태를 scheduled로 변경
        if update_data.scheduled_at and post.status == "draft":
            post.status = "scheduled"

        await self.db.commit()
        await self.db.refresh(post)
        return post

    async def delete_post(self, user: User, shop_id: UUID, post_id: UUID) -> None:
        """포스트를 삭제합니다."""
        post = await self.get_post_by_id(user, shop_id, post_id)
        if not post:
            raise PostException("포스트를 찾을 수 없습니다.", status_code=404)

        if post.status == "published":
            raise PostException("게시된 포스트는 삭제할 수 없습니다.", status_code=400)

        await self.db.delete(post)
        await self.db.commit()

    async def publish_post(self, user: User, shop_id: UUID, post_id: UUID) -> Post:
        """포스트를 즉시 발행합니다."""
        post = await self.get_post_by_id(user, shop_id, post_id)
        if not post:
            raise PostException("포스트를 찾을 수 없습니다.", status_code=404)

        if post.status == "published":
            raise PostException("이미 게시된 포스트입니다.", status_code=400)

        # TODO: 실제 Instagram API 호출
        # 지금은 상태만 변경
        post.status = "published"
        post.published_at = datetime.now(UTC)
        post.instagram_post_id = f"ig_{post.id}"  # Placeholder

        await self.db.commit()
        await self.db.refresh(post)
        return post

    async def get_post_stats(self, user: User, shop_id: UUID) -> dict[str, Any]:
        """포스트 통계를 조회합니다."""
        shop = await self._get_user_shop(user, shop_id)
        if not shop:
            raise PostException("매장을 찾을 수 없습니다.", status_code=404)

        # 총 포스트 수
        total_result = await self.db.execute(
            select(func.count(Post.id)).where(Post.shop_id == shop_id)
        )
        total_posts = total_result.scalar() or 0

        # 상태별 개수
        status_result = await self.db.execute(
            select(Post.status, func.count(Post.id))
            .where(Post.shop_id == shop_id)
            .group_by(Post.status)
        )
        status_counts = {row[0]: row[1] for row in status_result.all()}

        return {
            "total_posts": total_posts,
            "draft_count": status_counts.get("draft", 0),
            "scheduled_count": status_counts.get("scheduled", 0),
            "published_count": status_counts.get("published", 0),
            "failed_count": status_counts.get("failed", 0),
        }

    async def duplicate_post(
        self, user: User, shop_id: UUID, post_id: UUID
    ) -> Post:
        """포스트를 복제합니다."""
        original = await self.get_post_by_id(user, shop_id, post_id)
        if not original:
            raise PostException("포스트를 찾을 수 없습니다.", status_code=404)

        new_post = Post(
            shop_id=shop_id,
            image_url=original.image_url,
            caption=original.caption,
            hashtags=original.hashtags.copy() if original.hashtags else [],
            status="draft",
        )

        self.db.add(new_post)
        await self.db.commit()
        await self.db.refresh(new_post)
        return new_post
