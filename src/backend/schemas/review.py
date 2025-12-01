"""
리뷰 관련 스키마
"""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


ReviewStatus = Literal["pending", "replied", "ignored"]


class ReviewCreate(BaseModel):
    """리뷰 생성 요청"""

    reviewer_name: str = Field(min_length=1, max_length=255, alias="reviewerName")
    reviewer_profile_url: str | None = Field(default=None, alias="reviewerProfileUrl")
    rating: int = Field(ge=1, le=5)
    content: str | None = None
    review_date: datetime = Field(alias="reviewDate")
    google_review_id: str | None = Field(default=None, alias="googleReviewId")

    model_config = {"populate_by_name": True}


class ReviewUpdate(BaseModel):
    """리뷰 수정 요청"""

    status: ReviewStatus | None = None
    final_response: str | None = Field(default=None, alias="finalResponse")

    model_config = {"populate_by_name": True}


class ReviewResponse(BaseModel):
    """리뷰 응답"""

    id: UUID
    shop_id: UUID = Field(alias="shopId")
    reviewer_name: str = Field(alias="reviewerName")
    reviewer_profile_url: str | None = Field(default=None, alias="reviewerProfileUrl")
    rating: int
    content: str | None = None
    review_date: datetime = Field(alias="reviewDate")
    status: str
    ai_response: str | None = Field(default=None, alias="aiResponse")
    ai_response_generated_at: datetime | None = Field(
        default=None, alias="aiResponseGeneratedAt"
    )
    final_response: str | None = Field(default=None, alias="finalResponse")
    replied_at: datetime | None = Field(default=None, alias="repliedAt")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    model_config = {"from_attributes": True, "populate_by_name": True}


class ReviewListResponse(BaseModel):
    """리뷰 목록 응답"""

    reviews: list[ReviewResponse]
    total: int


class ReviewStatsResponse(BaseModel):
    """리뷰 통계 응답"""

    total_reviews: int = Field(alias="totalReviews")
    average_rating: float = Field(alias="averageRating")
    pending_count: int = Field(alias="pendingCount")
    replied_count: int = Field(alias="repliedCount")
    ignored_count: int = Field(alias="ignoredCount")

    model_config = {"populate_by_name": True}
