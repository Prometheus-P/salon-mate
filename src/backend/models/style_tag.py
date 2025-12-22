"""
스타일 태그 모델
Vision AI로 분석된 시술 사진의 스타일 정보
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import GUID, BaseModel

if TYPE_CHECKING:
    from models.shop import Shop


class StyleTag(BaseModel):
    """스타일 태그 엔티티

    Vision AI로 분석된 시술 사진의 메타데이터를 저장합니다.
    뷰티샵의 '스타일북' 기능에 활용됩니다.
    """

    __tablename__ = "style_tags"

    shop_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("shops.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # 이미지 정보
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # 분석 상태
    analysis_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pending",  # pending, analyzing, completed, failed
        index=True,
    )
    analyzed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # 서비스 유형 (네일, 헤어, 메이크업, 속눈썹 등)
    service_type: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)

    # 스타일 카테고리 (미니멀, 럭셔리, 트렌디, 클래식, 내추럴 등)
    style_category: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)

    # 시즌/트렌드 (S/S 2025, F/W 2024, 웨딩, 파티 등)
    season_trend: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # 주요 색상 (hex 코드 리스트)
    dominant_colors: Mapped[list] = mapped_column(JSON, default=list, nullable=False)

    # 기법/디테일 태그 (프렌치, 글리터, 그라데이션, 발레아쥬 등)
    technique_tags: Mapped[list] = mapped_column(JSON, default=list, nullable=False)

    # 분위기/감성 태그 (청순, 화려, 시크, 러블리 등)
    mood_tags: Mapped[list] = mapped_column(JSON, default=list, nullable=False)

    # AI 생성 설명 (인스타 캡션용)
    ai_description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # AI 추천 해시태그
    suggested_hashtags: Mapped[list] = mapped_column(JSON, default=list, nullable=False)

    # 신뢰도 점수 (0.0 ~ 1.0)
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    # 원본 AI 응답 (디버깅/개선용)
    raw_ai_response: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # 관계
    shop: Mapped["Shop"] = relationship("Shop", back_populates="style_tags")

    @property
    def all_tags(self) -> list[str]:
        """모든 태그를 통합하여 반환"""
        tags = []
        if self.service_type:
            tags.append(self.service_type)
        if self.style_category:
            tags.append(self.style_category)
        if self.season_trend:
            tags.append(self.season_trend)
        tags.extend(self.technique_tags or [])
        tags.extend(self.mood_tags or [])
        return tags

    def __repr__(self) -> str:
        return f"<StyleTag {self.id} - {self.service_type}/{self.style_category}>"
