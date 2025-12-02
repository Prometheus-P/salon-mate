"""
Dashboard Pydantic schemas
"""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field

# ============== Review Stats ==============


class PlatformStats(BaseModel):
    """Platform-specific review statistics"""

    total_reviews: int = Field(ge=0)
    average_rating: float = Field(ge=0, le=5)
    response_rate: float = Field(ge=0, le=100)


class ReviewStatsResponse(BaseModel):
    """Response schema for review statistics"""

    total_reviews: int = Field(ge=0)
    average_rating: float = Field(ge=0, le=5)
    response_rate: float = Field(
        ge=0, le=100, description="Percentage of reviews with responses"
    )
    pending_count: int = Field(ge=0)
    by_platform: dict[str, PlatformStats]
    last_synced_at: datetime


# ============== Posting Calendar ==============


class PostSummary(BaseModel):
    """Summary of a post for calendar display"""

    id: UUID
    status: str = Field(pattern="^(draft|scheduled|published|failed)$")
    image_url: str
    caption_snippet: str | None = Field(max_length=50, default=None)
    scheduled_at: datetime | None = None
    published_at: datetime | None = None


class CalendarEntry(BaseModel):
    """A single day's posts in the calendar"""

    date: date
    posts: list[PostSummary]


class CalendarResponse(BaseModel):
    """Response schema for posting calendar"""

    start_date: date
    end_date: date
    entries: list[CalendarEntry]
    last_synced_at: datetime


# ============== Engagement Metrics ==============


class TopPost(BaseModel):
    """Top performing post by engagement"""

    id: UUID
    image_url: str
    likes_count: int = Field(ge=0)
    comments_count: int = Field(ge=0)
    reach_count: int = Field(ge=0)
    engagement_score: int = Field(
        ge=0, description="Computed score: likes + comments*2 + reach/10"
    )


class EngagementResponse(BaseModel):
    """Response schema for engagement metrics"""

    total_likes: int = Field(ge=0)
    total_comments: int = Field(ge=0)
    total_reach: int = Field(ge=0)
    top_posts: list[TopPost] = Field(max_length=5)
    last_synced_at: datetime


# ============== Trend Charts ==============


class TrendDataPoint(BaseModel):
    """A single data point in trend charts"""

    date: date
    review_count: int = Field(ge=0)
    average_rating: float = Field(ge=0, le=5)
    response_rate: float = Field(ge=0, le=100)


class TrendResponse(BaseModel):
    """Response schema for trend data"""

    period: str = Field(pattern="^(week|month|year)$")
    data_points: list[TrendDataPoint]


# ============== Pending Reviews ==============


class PendingReview(BaseModel):
    """A review awaiting response"""

    id: UUID
    reviewer_name: str
    reviewer_profile_url: str | None = None
    rating: int = Field(ge=1, le=5)
    content: str | None = None
    review_date: datetime
    platform: str = Field(pattern="^(google|naver)$")
    ai_response: str | None = Field(
        default=None, description="Previously generated AI response if any"
    )


class PendingReviewsResponse(BaseModel):
    """Response schema for pending reviews list"""

    reviews: list[PendingReview]
    total_pending: int = Field(ge=0)


# ============== AI Response Generation ==============


class GeneratedResponseResult(BaseModel):
    """Result of AI response generation"""

    review_id: UUID
    ai_response: str
    generated_at: datetime


class PublishResponseRequest(BaseModel):
    """Request to publish a response"""

    final_response: str = Field(
        min_length=1,
        max_length=5000,
        description="The approved response text to publish",
    )


class PublishResponseResult(BaseModel):
    """Result of publishing a response"""

    review_id: UUID
    status: str = Field(default="replied")
    replied_at: datetime


# ============== Shop Selector ==============


class ShopSummary(BaseModel):
    """Shop summary for selector dropdown"""

    id: UUID
    name: str
    type: str
    has_reviews: bool = False
    has_posts: bool = False


class ShopsListResponse(BaseModel):
    """Response schema for user's shops list"""

    shops: list[ShopSummary]
