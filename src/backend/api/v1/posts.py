"""
포스트 엔드포인트
Instagram 포스트 CRUD 및 발행 API
"""

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db
from models.user import User
from schemas.post import (
    AICaptionRequest,
    AICaptionResponse,
    HashtagRecommendationResponse,
    OptimalTimeResponse,
    PostCreate,
    PostListResponse,
    PostResponse,
    PostStatsResponse,
    PostUpdate,
)
from models.post import Post
from services.auth_service import AuthException, AuthService
from services.post_service import PostException, PostService

router = APIRouter()
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """현재 인증된 사용자를 반환합니다."""
    auth_service = AuthService(db)
    try:
        return await auth_service.get_current_user(credentials.credentials)
    except AuthException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message) from e


def get_post_service(db: AsyncSession = Depends(get_db)) -> PostService:
    """포스트 서비스 의존성"""
    return PostService(db)


def _post_to_response(post: Post) -> PostResponse:
    """Post 모델을 응답 스키마로 변환합니다."""
    return PostResponse(
        id=post.id,
        shopId=post.shop_id,
        instagramPostId=post.instagram_post_id,
        status=post.status,
        imageUrl=post.image_url,
        caption=post.caption,
        captionSnippet=post.caption_snippet,
        hashtags=post.hashtags or [],
        scheduledAt=post.scheduled_at,
        publishedAt=post.published_at,
        likesCount=post.likes_count,
        commentsCount=post.comments_count,
        reachCount=post.reach_count,
        engagementScore=post.engagement_score,
        errorMessage=post.error_message,
        createdAt=post.created_at,
        updatedAt=post.updated_at,
    )


@router.post(
    "",
    response_model=PostResponse,
    status_code=status.HTTP_201_CREATED,
    summary="포스트 생성",
)
async def create_post(
    shop_id: UUID,
    post_data: PostCreate,
    current_user: User = Depends(get_current_user),
    post_service: PostService = Depends(get_post_service),
) -> PostResponse:
    """새 포스트를 생성합니다."""
    try:
        post = await post_service.create_post(current_user, shop_id, post_data)
        return _post_to_response(post)
    except PostException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message) from e


@router.get(
    "",
    response_model=PostListResponse,
    summary="포스트 목록 조회",
)
async def get_posts(
    shop_id: UUID,
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    post_service: PostService = Depends(get_post_service),
) -> PostListResponse:
    """매장의 포스트 목록을 조회합니다."""
    try:
        posts, total = await post_service.get_posts(
            current_user, shop_id, status_filter, limit, offset
        )
        return PostListResponse(
            posts=[_post_to_response(p) for p in posts],
            total=total,
        )
    except PostException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message) from e


@router.get(
    "/stats",
    response_model=PostStatsResponse,
    summary="포스트 통계 조회",
)
async def get_post_stats(
    shop_id: UUID,
    current_user: User = Depends(get_current_user),
    post_service: PostService = Depends(get_post_service),
) -> PostStatsResponse:
    """매장의 포스트 통계를 조회합니다."""
    try:
        stats = await post_service.get_post_stats(current_user, shop_id)
        return PostStatsResponse(
            totalPosts=stats["total_posts"],
            draftCount=stats["draft_count"],
            scheduledCount=stats["scheduled_count"],
            publishedCount=stats["published_count"],
            failedCount=stats["failed_count"],
        )
    except PostException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message) from e


@router.get(
    "/optimal-times",
    response_model=OptimalTimeResponse,
    summary="최적 발행 시간 추천",
)
async def get_optimal_times(
    shop_id: UUID,
    current_user: User = Depends(get_current_user),
) -> OptimalTimeResponse:
    """최적의 포스트 발행 시간을 추천합니다."""
    # TODO: 실제 인게이지먼트 데이터 기반 분석
    return OptimalTimeResponse(
        times=[
            {"day": "화", "time": "10:00", "reason": "인게이지먼트 최고"},
            {"day": "목", "time": "19:00", "reason": "도달률 최고"},
            {"day": "토", "time": "14:00", "reason": "주말 활성 시간"},
        ]
    )


@router.get(
    "/{post_id}",
    response_model=PostResponse,
    summary="포스트 상세 조회",
)
async def get_post(
    shop_id: UUID,
    post_id: UUID,
    current_user: User = Depends(get_current_user),
    post_service: PostService = Depends(get_post_service),
) -> PostResponse:
    """포스트 상세 정보를 조회합니다."""
    post = await post_service.get_post_by_id(current_user, shop_id, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="포스트를 찾을 수 없습니다.")
    return _post_to_response(post)


@router.patch(
    "/{post_id}",
    response_model=PostResponse,
    summary="포스트 수정",
)
async def update_post(
    shop_id: UUID,
    post_id: UUID,
    update_data: PostUpdate,
    current_user: User = Depends(get_current_user),
    post_service: PostService = Depends(get_post_service),
) -> PostResponse:
    """포스트 정보를 수정합니다."""
    try:
        post = await post_service.update_post(
            current_user, shop_id, post_id, update_data
        )
        return _post_to_response(post)
    except PostException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message) from e


@router.delete(
    "/{post_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="포스트 삭제",
)
async def delete_post(
    shop_id: UUID,
    post_id: UUID,
    current_user: User = Depends(get_current_user),
    post_service: PostService = Depends(get_post_service),
) -> Response:
    """포스트를 삭제합니다."""
    try:
        await post_service.delete_post(current_user, shop_id, post_id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except PostException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message) from e


@router.post(
    "/{post_id}/publish",
    response_model=PostResponse,
    summary="포스트 즉시 발행",
)
async def publish_post(
    shop_id: UUID,
    post_id: UUID,
    current_user: User = Depends(get_current_user),
    post_service: PostService = Depends(get_post_service),
) -> PostResponse:
    """포스트를 즉시 Instagram에 발행합니다."""
    try:
        post = await post_service.publish_post(current_user, shop_id, post_id)
        return _post_to_response(post)
    except PostException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message) from e


@router.post(
    "/{post_id}/duplicate",
    response_model=PostResponse,
    status_code=status.HTTP_201_CREATED,
    summary="포스트 복제",
)
async def duplicate_post(
    shop_id: UUID,
    post_id: UUID,
    current_user: User = Depends(get_current_user),
    post_service: PostService = Depends(get_post_service),
) -> PostResponse:
    """포스트를 복제하여 새 초안을 생성합니다."""
    try:
        post = await post_service.duplicate_post(current_user, shop_id, post_id)
        return _post_to_response(post)
    except PostException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message) from e


# AI Content Generation Endpoints


@router.post(
    "/ai/generate-caption",
    response_model=AICaptionResponse,
    summary="AI 캡션 생성",
)
async def generate_ai_caption(
    shop_id: UUID,
    request: AICaptionRequest,
    current_user: User = Depends(get_current_user),
) -> AICaptionResponse:
    """AI를 사용하여 Instagram 캡션을 생성합니다."""
    # TODO: 실제 AI 서비스 연동
    # 지금은 목업 응답
    caption = f"✨ {request.prompt}\n\n"
    if request.include_emoji:
        caption += "💇‍♀️ 새로운 스타일로 특별한 변화를 선물하세요!\n"
    if request.include_cta:
        caption += "\n📞 예약 문의 환영합니다!"

    hashtags = ["#미용실", "#헤어스타일", "#헤어스타그램", "#뷰티", "#변신"]

    return AICaptionResponse(
        caption=caption,
        hashtags=hashtags,
        generatedAt=datetime.now(UTC),
    )


@router.get(
    "/ai/recommend-hashtags",
    response_model=HashtagRecommendationResponse,
    summary="해시태그 추천",
)
async def recommend_hashtags(
    shop_id: UUID,
    current_user: User = Depends(get_current_user),
) -> HashtagRecommendationResponse:
    """해시태그를 추천합니다."""
    # TODO: 실제 AI 서비스 연동
    return HashtagRecommendationResponse(
        industry=["#미용실", "#헤어살롱", "#헤어샵", "#뷰티샵"],
        location=["#강남미용실", "#홍대헤어", "#신촌미용실"],
        trending=["#오늘의헤어", "#헤어스타그램", "#데일리룩"],
        aiRecommended=["#펌스타일", "#염색", "#커트", "#트렌드헤어"],
    )
