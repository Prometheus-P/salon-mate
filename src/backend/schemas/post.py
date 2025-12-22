"""
포스트 관련 스키마
"""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

PostStatus = Literal["draft", "scheduled", "published", "failed", "cancelled"]


class PostCreate(BaseModel):
    """포스트 생성 요청"""

    image_url: str = Field(max_length=500, alias="imageUrl")
    caption: str | None = None
    hashtags: list[str] = Field(default_factory=list)
    scheduled_at: datetime | None = Field(default=None, alias="scheduledAt")

    model_config = {"populate_by_name": True}


class PostUpdate(BaseModel):
    """포스트 수정 요청"""

    image_url: str | None = Field(default=None, max_length=500, alias="imageUrl")
    caption: str | None = None
    hashtags: list[str] | None = None
    scheduled_at: datetime | None = Field(default=None, alias="scheduledAt")
    status: PostStatus | None = None

    model_config = {"populate_by_name": True}


class PostResponse(BaseModel):
    """포스트 응답"""

    id: UUID
    shop_id: UUID = Field(alias="shopId")
    instagram_post_id: str | None = Field(default=None, alias="instagramPostId")
    status: str
    image_url: str = Field(alias="imageUrl")
    caption: str | None = None
    caption_snippet: str = Field(alias="captionSnippet")
    hashtags: list[str]
    scheduled_at: datetime | None = Field(default=None, alias="scheduledAt")
    published_at: datetime | None = Field(default=None, alias="publishedAt")
    likes_count: int = Field(alias="likesCount")
    comments_count: int = Field(alias="commentsCount")
    reach_count: int = Field(alias="reachCount")
    engagement_score: int = Field(alias="engagementScore")
    error_message: str | None = Field(default=None, alias="errorMessage")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    model_config = {"from_attributes": True, "populate_by_name": True}


class PostListResponse(BaseModel):
    """포스트 목록 응답"""

    posts: list[PostResponse]
    total: int


class PostStatsResponse(BaseModel):
    """포스트 통계 응답"""

    total_posts: int = Field(alias="totalPosts")
    draft_count: int = Field(alias="draftCount")
    scheduled_count: int = Field(alias="scheduledCount")
    published_count: int = Field(alias="publishedCount")
    failed_count: int = Field(alias="failedCount")

    model_config = {"populate_by_name": True}


# AI Content Generation Schemas
class AICaptionRequest(BaseModel):
    """AI 캡션 생성 요청"""

    prompt: str
    tone: Literal["friendly", "professional", "trendy", "emotional"] = "trendy"
    length: Literal["short", "medium", "long"] = "medium"
    include_cta: bool = Field(default=True, alias="includeCta")
    include_emoji: bool = Field(default=True, alias="includeEmoji")
    language: Literal["ko", "en", "mixed"] = "ko"

    model_config = {"populate_by_name": True}


class AICaptionResponse(BaseModel):
    """AI 캡션 생성 응답"""

    caption: str
    hashtags: list[str]
    generated_at: datetime = Field(alias="generatedAt")

    model_config = {"populate_by_name": True}


class AIImageRequest(BaseModel):
    """AI 이미지 생성 요청"""

    prompt: str
    style: Literal["professional", "trendy", "emotional", "humorous"] = "trendy"
    mood: Literal["bright", "calm", "luxury", "casual"] = "bright"
    color_tone: Literal["warm", "cool", "mono", "vivid"] = Field(
        default="warm", alias="colorTone"
    )
    count: int = Field(default=4, ge=1, le=4)

    model_config = {"populate_by_name": True}


class AIImageResponse(BaseModel):
    """AI 이미지 생성 응답"""

    images: list[str]  # URLs
    caption: str
    hashtags: list[str]
    generated_at: datetime = Field(alias="generatedAt")

    model_config = {"populate_by_name": True}


class HashtagRecommendationResponse(BaseModel):
    """해시태그 추천 응답"""

    industry: list[str]  # 업종 관련
    location: list[str]  # 위치 기반
    trending: list[str]  # 트렌드
    ai_recommended: list[str] = Field(alias="aiRecommended")  # AI 추천

    model_config = {"populate_by_name": True}


class OptimalTimeResponse(BaseModel):
    """최적 발행 시간 응답"""

    times: list[dict]  # {"day": "화", "time": "10:00", "reason": "인게이지먼트 최고"}

    model_config = {"populate_by_name": True}
