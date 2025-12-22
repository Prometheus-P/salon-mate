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


# Analytics Schemas
class MetricComparison(BaseModel):
    """메트릭 비교 데이터"""

    current: float
    previous: float
    change_percent: float = Field(alias="changePercent")

    model_config = {"populate_by_name": True}


class RatingDistribution(BaseModel):
    """평점 분포"""

    rating: int
    count: int
    percent: float


class PlatformDistribution(BaseModel):
    """플랫폼별 분포"""

    platform: str
    count: int
    percent: float


class TrendDataPoint(BaseModel):
    """트렌드 데이터 포인트"""

    date: str
    review_count: int = Field(alias="reviewCount")
    average_rating: float = Field(alias="averageRating")

    model_config = {"populate_by_name": True}


class KeywordFrequency(BaseModel):
    """키워드 빈도"""

    keyword: str
    count: int


class SentimentAnalysis(BaseModel):
    """감성 분석 결과"""

    positive: int
    neutral: int
    negative: int
    positive_percent: float = Field(alias="positivePercent")
    neutral_percent: float = Field(alias="neutralPercent")
    negative_percent: float = Field(alias="negativePercent")

    model_config = {"populate_by_name": True}


class ReviewAnalyticsResponse(BaseModel):
    """리뷰 분석 응답"""

    # Summary metrics
    total_reviews: MetricComparison = Field(alias="totalReviews")
    average_rating: MetricComparison = Field(alias="averageRating")
    response_rate: MetricComparison = Field(alias="responseRate")

    # Distributions
    rating_distribution: list[RatingDistribution] = Field(alias="ratingDistribution")
    platform_distribution: list[PlatformDistribution] = Field(
        alias="platformDistribution"
    )

    # Trend data
    trend_data: list[TrendDataPoint] = Field(alias="trendData")

    # Keyword and sentiment
    keywords: list[KeywordFrequency]
    sentiment: SentimentAnalysis

    model_config = {"populate_by_name": True}


class ReviewExportItem(BaseModel):
    """리뷰 내보내기 항목"""

    id: str
    reviewer_name: str = Field(alias="reviewerName")
    rating: int
    content: str | None
    review_date: str = Field(alias="reviewDate")
    status: str
    platform: str
    response: str | None
    responded_at: str | None = Field(default=None, alias="respondedAt")

    model_config = {"populate_by_name": True}
