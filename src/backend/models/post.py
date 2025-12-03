"""
Instagram 포스트 모델
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import GUID, BaseModel

if TYPE_CHECKING:
    from models.shop import Shop


class PostStatus(str):
    """Post status enum values"""

    DRAFT = "draft"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    FAILED = "failed"


class Post(BaseModel):
    """Instagram 포스트 엔티티"""

    __tablename__ = "posts"

    shop_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("shops.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Instagram 정보
    instagram_post_id: Mapped[str | None] = mapped_column(
        String(255), unique=True, nullable=True, index=True
    )

    # 포스트 상태
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=PostStatus.DRAFT,
        index=True,
    )

    # 콘텐츠
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    caption: Mapped[str | None] = mapped_column(Text, nullable=True)
    hashtags: Mapped[list] = mapped_column(JSON, default=list, nullable=False)

    # 일정
    scheduled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # 인게이지먼트 메트릭
    likes_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    comments_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reach_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    engagement_synced_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # 에러 정보
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # 관계
    shop: Mapped["Shop"] = relationship("Shop", back_populates="posts")

    @property
    def engagement_score(self) -> int:
        """Calculate engagement score: likes + comments*2 + reach/10"""
        return self.likes_count + (self.comments_count * 2) + (self.reach_count // 10)

    @property
    def caption_snippet(self) -> str:
        """First 50 characters of caption"""
        if not self.caption:
            return ""
        return self.caption[:50] + ("..." if len(self.caption) > 50 else "")

    def __repr__(self) -> str:
        return f"<Post {self.id} - {self.status}>"
