"""
리뷰 엔드포인트
리뷰 CRUD 및 통계 API
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db
from models.user import User
from schemas.ai_response import AIResponseRequest, AIResponseResult
from schemas.review import (
    ReviewCreate,
    ReviewListResponse,
    ReviewResponse,
    ReviewStatsResponse,
    ReviewUpdate,
)
from services.ai_response_service import AIResponseException, AIResponseService
from services.auth_service import AuthException, AuthService
from services.review_service import ReviewException, ReviewService

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
        raise HTTPException(status_code=e.status_code, detail=e.message)


def get_review_service(db: AsyncSession = Depends(get_db)) -> ReviewService:
    """리뷰 서비스 의존성"""
    return ReviewService(db)


def get_ai_response_service(db: AsyncSession = Depends(get_db)) -> AIResponseService:
    """AI 응답 서비스 의존성"""
    return AIResponseService(db)


@router.post(
    "",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="리뷰 생성",
)
async def create_review(
    shop_id: UUID,
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    review_service: ReviewService = Depends(get_review_service),
) -> ReviewResponse:
    """새 리뷰를 생성합니다.

    - **reviewerName**: 리뷰어 이름
    - **rating**: 평점 (1-5)
    - **content**: 리뷰 내용 (선택)
    - **reviewDate**: 리뷰 작성일
    """
    try:
        review = await review_service.create_review(
            current_user, shop_id, review_data
        )
        return ReviewResponse(
            id=review.id,
            shopId=review.shop_id,
            reviewerName=review.reviewer_name,
            reviewerProfileUrl=review.reviewer_profile_url,
            rating=review.rating,
            content=review.content,
            reviewDate=review.review_date,
            status=review.status,
            aiResponse=review.ai_response,
            aiResponseGeneratedAt=review.ai_response_generated_at,
            finalResponse=review.final_response,
            repliedAt=review.replied_at,
            createdAt=review.created_at,
            updatedAt=review.updated_at,
        )
    except ReviewException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get(
    "",
    response_model=ReviewListResponse,
    summary="리뷰 목록 조회",
)
async def get_reviews(
    shop_id: UUID,
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    review_service: ReviewService = Depends(get_review_service),
) -> ReviewListResponse:
    """매장의 리뷰 목록을 조회합니다.

    - **status**: 필터링할 상태 (pending, replied, ignored)
    - **limit**: 조회할 개수 (기본 20, 최대 100)
    - **offset**: 시작 위치
    """
    try:
        reviews, total = await review_service.get_reviews(
            current_user, shop_id, status_filter, limit, offset
        )
        return ReviewListResponse(
            reviews=[
                ReviewResponse(
                    id=r.id,
                    shopId=r.shop_id,
                    reviewerName=r.reviewer_name,
                    reviewerProfileUrl=r.reviewer_profile_url,
                    rating=r.rating,
                    content=r.content,
                    reviewDate=r.review_date,
                    status=r.status,
                    aiResponse=r.ai_response,
                    aiResponseGeneratedAt=r.ai_response_generated_at,
                    finalResponse=r.final_response,
                    repliedAt=r.replied_at,
                    createdAt=r.created_at,
                    updatedAt=r.updated_at,
                )
                for r in reviews
            ],
            total=total,
        )
    except ReviewException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get(
    "/stats",
    response_model=ReviewStatsResponse,
    summary="리뷰 통계 조회",
)
async def get_review_stats(
    shop_id: UUID,
    current_user: User = Depends(get_current_user),
    review_service: ReviewService = Depends(get_review_service),
) -> ReviewStatsResponse:
    """매장의 리뷰 통계를 조회합니다."""
    try:
        stats = await review_service.get_review_stats(current_user, shop_id)
        return ReviewStatsResponse(
            totalReviews=stats["total_reviews"],
            averageRating=stats["average_rating"],
            pendingCount=stats["pending_count"],
            repliedCount=stats["replied_count"],
            ignoredCount=stats["ignored_count"],
        )
    except ReviewException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get(
    "/{review_id}",
    response_model=ReviewResponse,
    summary="리뷰 상세 조회",
)
async def get_review(
    shop_id: UUID,
    review_id: UUID,
    current_user: User = Depends(get_current_user),
    review_service: ReviewService = Depends(get_review_service),
) -> ReviewResponse:
    """리뷰 상세 정보를 조회합니다."""
    review = await review_service.get_review_by_id(current_user, shop_id, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="리뷰를 찾을 수 없습니다.")

    return ReviewResponse(
        id=review.id,
        shopId=review.shop_id,
        reviewerName=review.reviewer_name,
        reviewerProfileUrl=review.reviewer_profile_url,
        rating=review.rating,
        content=review.content,
        reviewDate=review.review_date,
        status=review.status,
        aiResponse=review.ai_response,
        aiResponseGeneratedAt=review.ai_response_generated_at,
        finalResponse=review.final_response,
        repliedAt=review.replied_at,
        createdAt=review.created_at,
        updatedAt=review.updated_at,
    )


@router.patch(
    "/{review_id}",
    response_model=ReviewResponse,
    summary="리뷰 수정",
)
async def update_review(
    shop_id: UUID,
    review_id: UUID,
    update_data: ReviewUpdate,
    current_user: User = Depends(get_current_user),
    review_service: ReviewService = Depends(get_review_service),
) -> ReviewResponse:
    """리뷰 정보를 수정합니다.

    - **status**: 상태 변경 (pending, replied, ignored)
    - **finalResponse**: 최종 답변 내용
    """
    try:
        review = await review_service.update_review(
            current_user, shop_id, review_id, update_data
        )
        return ReviewResponse(
            id=review.id,
            shopId=review.shop_id,
            reviewerName=review.reviewer_name,
            reviewerProfileUrl=review.reviewer_profile_url,
            rating=review.rating,
            content=review.content,
            reviewDate=review.review_date,
            status=review.status,
            aiResponse=review.ai_response,
            aiResponseGeneratedAt=review.ai_response_generated_at,
            finalResponse=review.final_response,
            repliedAt=review.replied_at,
            createdAt=review.created_at,
            updatedAt=review.updated_at,
        )
    except ReviewException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete(
    "/{review_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="리뷰 삭제",
)
async def delete_review(
    shop_id: UUID,
    review_id: UUID,
    current_user: User = Depends(get_current_user),
    review_service: ReviewService = Depends(get_review_service),
) -> Response:
    """리뷰를 삭제합니다."""
    try:
        await review_service.delete_review(current_user, shop_id, review_id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except ReviewException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post(
    "/{review_id}/ai-response",
    response_model=AIResponseResult,
    summary="AI 답변 생성",
)
async def generate_ai_response(
    shop_id: UUID,
    review_id: UUID,
    request: AIResponseRequest | None = None,
    current_user: User = Depends(get_current_user),
    ai_service: AIResponseService = Depends(get_ai_response_service),
) -> AIResponseResult:
    """리뷰에 대한 AI 답변을 생성합니다.

    - **tone**: 답변 톤 (friendly, formal, casual)
    - **includeShopName**: 매장 이름 포함 여부
    - **maxLength**: 최대 글자 수
    """
    try:
        request_data = request or AIResponseRequest()
        ai_response, generated_at = await ai_service.generate_response(
            user=current_user,
            shop_id=shop_id,
            review_id=review_id,
            tone=request_data.tone or "friendly",
            include_shop_name=request_data.include_shop_name,
            max_length=request_data.max_length,
        )
        return AIResponseResult(
            aiResponse=ai_response,
            generatedAt=generated_at,
        )
    except AIResponseException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
