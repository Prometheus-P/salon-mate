"""
리뷰 모델
Google 리뷰 및 AI 답변 정보를 저장합니다.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Literal

from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import BaseModel, GUID

if TYPE_CHECKING:
    from models.shop import Shop


class Review(BaseModel):
    """리뷰 엔티티"""

    __tablename__ = "reviews"

    shop_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("shops.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Google Review 정보
    google_review_id: Mapped[str | None] = mapped_column(
        String(255), unique=True, nullable=True, index=True
    )
    reviewer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    reviewer_profile_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    review_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    # 상태 관리
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pending",
        index=True,
    )  # pending, replied, ignored

    # AI 답변 정보
    ai_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_response_generated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    final_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    replied_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # 관계
    shop: Mapped["Shop"] = relationship("Shop", back_populates="reviews")

    def __repr__(self) -> str:
        return f"<Review {self.id} - {self.rating}stars>"
