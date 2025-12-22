"""
스타일북 API 엔드포인트
Vision AI 기반 시술 사진 분석 및 스타일 관리
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_db
from models.style_tag import StyleTag
from models.user import User
from services.vision_service import VisionService, VisionServiceError

router = APIRouter()


# ============== Schemas ==============


class StyleTagBase(BaseModel):
    """스타일 태그 기본 응답"""

    model_config = ConfigDict(from_attributes=True)

    id: str
    image_url: str
    thumbnail_url: str | None
    analysis_status: str
    service_type: str | None
    style_category: str | None
    season_trend: str | None
    dominant_colors: list[str]
    technique_tags: list[str]
    mood_tags: list[str]
    ai_description: str | None
    suggested_hashtags: list[str]
    confidence_score: float | None
    analyzed_at: str | None
    created_at: str


class StyleTagResponse(StyleTagBase):
    """단일 스타일 태그 응답"""

    pass


class StyleTagListResponse(BaseModel):
    """스타일 태그 목록 응답"""

    style_tags: list[StyleTagBase]
    total: int
    limit: int
    offset: int


class AnalyzeImageRequest(BaseModel):
    """이미지 분석 요청"""

    image_url: str = Field(..., description="분석할 이미지 URL (공개 접근 가능)")
    thumbnail_url: str | None = Field(None, description="썸네일 URL (선택)")


class AnalyzeBase64Request(BaseModel):
    """Base64 이미지 분석 요청"""

    image_data: str = Field(..., description="Base64 인코딩된 이미지 데이터")
    image_format: str = Field("jpeg", description="이미지 포맷 (jpeg, png, gif, webp)")


class StyleStatisticsResponse(BaseModel):
    """스타일 통계 응답"""

    total_count: int
    by_service_type: dict[str, int]
    by_style_category: dict[str, int]


class ContentSuggestionResponse(BaseModel):
    """콘텐츠 제안 응답"""

    caption: str
    hashtags: list[str]


# ============== Helper ==============


def style_tag_to_response(style_tag: StyleTag) -> StyleTagResponse:
    """StyleTag 모델을 응답 스키마로 변환"""
    return StyleTagResponse(
        id=str(style_tag.id),
        image_url=style_tag.image_url,
        thumbnail_url=style_tag.thumbnail_url,
        analysis_status=style_tag.analysis_status,
        service_type=style_tag.service_type,
        style_category=style_tag.style_category,
        season_trend=style_tag.season_trend,
        dominant_colors=style_tag.dominant_colors or [],
        technique_tags=style_tag.technique_tags or [],
        mood_tags=style_tag.mood_tags or [],
        ai_description=style_tag.ai_description,
        suggested_hashtags=style_tag.suggested_hashtags or [],
        confidence_score=style_tag.confidence_score,
        analyzed_at=style_tag.analyzed_at.isoformat()
        if style_tag.analyzed_at
        else None,
        created_at=style_tag.created_at.isoformat() if style_tag.created_at else "",
    )


# ============== Endpoints ==============


@router.post("", response_model=StyleTagResponse, status_code=status.HTTP_201_CREATED)
async def analyze_image(
    shop_id: UUID,
    request: AnalyzeImageRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
) -> StyleTagResponse:
    """이미지 분석 및 스타일 태그 생성

    Vision AI를 사용하여 시술 사진을 분석하고
    스타일 태그를 자동으로 생성합니다.
    """
    vision_service = VisionService(db)

    try:
        style_tag = await vision_service.analyze_image(
            shop_id=shop_id,
            image_url=request.image_url,
            thumbnail_url=request.thumbnail_url,
        )
        return style_tag_to_response(style_tag)

    except VisionServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message) from e

    finally:
        await vision_service.close()


@router.post(
    "/analyze-base64",
    response_model=StyleTagResponse,
    status_code=status.HTTP_201_CREATED,
)
async def analyze_base64_image(
    shop_id: UUID,
    request: AnalyzeBase64Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
) -> StyleTagResponse:
    """Base64 이미지 분석

    Base64 인코딩된 이미지를 직접 분석합니다.
    """
    vision_service = VisionService(db)

    try:
        style_tag = await vision_service.analyze_image_from_base64(
            shop_id=shop_id,
            image_data=request.image_data,
            image_format=request.image_format,
        )
        return style_tag_to_response(style_tag)

    except VisionServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message) from e

    finally:
        await vision_service.close()


@router.get("", response_model=StyleTagListResponse)
async def get_style_tags(
    shop_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service_type: str | None = Query(None, description="시술 유형 필터"),
    style_category: str | None = Query(None, description="스타일 카테고리 필터"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> StyleTagListResponse:
    """스타일 태그 목록 조회

    매장의 분석된 스타일 태그 목록을 조회합니다.
    """
    vision_service = VisionService(db)

    try:
        style_tags, total = await vision_service.get_style_tags(
            shop_id=shop_id,
            service_type=service_type,
            style_category=style_category,
            limit=limit,
            offset=offset,
        )

        return StyleTagListResponse(
            style_tags=[style_tag_to_response(st) for st in style_tags],
            total=total,
            limit=limit,
            offset=offset,
        )

    finally:
        await vision_service.close()


@router.get("/statistics", response_model=StyleStatisticsResponse)
async def get_style_statistics(
    shop_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
) -> StyleStatisticsResponse:
    """스타일 통계 조회

    매장의 스타일 분석 통계를 조회합니다.
    """
    vision_service = VisionService(db)

    try:
        stats = await vision_service.get_style_statistics(shop_id)
        return StyleStatisticsResponse(**stats)

    finally:
        await vision_service.close()


@router.get("/{style_tag_id}", response_model=StyleTagResponse)
async def get_style_tag(
    shop_id: UUID,
    style_tag_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
) -> StyleTagResponse:
    """특정 스타일 태그 조회"""
    vision_service = VisionService(db)

    try:
        style_tag = await vision_service.get_style_tag_by_id(shop_id, style_tag_id)

        if not style_tag:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="스타일 태그를 찾을 수 없습니다.",
            )

        return style_tag_to_response(style_tag)

    finally:
        await vision_service.close()


@router.get("/{style_tag_id}/suggest", response_model=ContentSuggestionResponse)
async def get_content_suggestion(
    shop_id: UUID,
    style_tag_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
) -> ContentSuggestionResponse:
    """스타일 기반 콘텐츠 제안

    스타일 태그를 기반으로 인스타그램 포스팅용
    캡션과 해시태그를 제안합니다.
    """
    vision_service = VisionService(db)

    try:
        style_tag = await vision_service.get_style_tag_by_id(shop_id, style_tag_id)

        if not style_tag:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="스타일 태그를 찾을 수 없습니다.",
            )

        suggestion = await vision_service.suggest_content_for_style(style_tag)
        return ContentSuggestionResponse(**suggestion)

    finally:
        await vision_service.close()


@router.delete("/{style_tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_style_tag(
    shop_id: UUID,
    style_tag_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
) -> None:
    """스타일 태그 삭제"""
    vision_service = VisionService(db)

    try:
        deleted = await vision_service.delete_style_tag(shop_id, style_tag_id)

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="스타일 태그를 찾을 수 없습니다.",
            )

    finally:
        await vision_service.close()
