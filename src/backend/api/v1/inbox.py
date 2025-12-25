"""
인박스 엔드포인트 (Agency Mode)
전체 샵의 리뷰를 통합 관리하는 API
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db
from models.user import User
from schemas.review import (
    BulkApproveRequest,
    BulkApproveResponse,
    GlobalInboxResponse,
    InboxReviewItem,
)
from services.auth_service import AuthException, AuthService
from services.review_service import ReviewService

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


def get_review_service(db: AsyncSession = Depends(get_db)) -> ReviewService:
    """리뷰 서비스 의존성"""
    return ReviewService(db)


@router.get(
    "",
    response_model=GlobalInboxResponse,
    summary="전체 샵 인박스 조회",
    description="사용자의 모든 샵에서 답변 대기 중인 리뷰를 통합 조회합니다. (Agency Mode)",
)
async def get_global_inbox(
    limit: int = Query(default=50, ge=1, le=100, description="조회할 개수"),
    offset: int = Query(default=0, ge=0, description="시작 위치"),
    current_user: User = Depends(get_current_user),
    review_service: ReviewService = Depends(get_review_service),
) -> GlobalInboxResponse:
    """전체 샵의 pending 리뷰를 통합 조회합니다.

    Agency 모드에서 한 사용자가 여러 매장을 관리할 때,
    모든 매장의 답변 대기 중인 리뷰를 한 화면에서 확인할 수 있습니다.

    - 리뷰는 review_date 최신순으로 정렬됩니다
    - 각 리뷰에는 해당 샵 이름이 포함됩니다
    """
    reviews, total_pending = await review_service.get_all_pending_reviews(
        current_user, limit, offset
    )

    return GlobalInboxResponse(
        totalPending=total_pending,
        reviews=[
            InboxReviewItem(
                id=r["id"],
                shopId=r["shop_id"],
                shopName=r["shop_name"],
                reviewerName=r["reviewer_name"],
                reviewerProfileUrl=r["reviewer_profile_url"],
                rating=r["rating"],
                content=r["content"],
                reviewDate=r["review_date"],
                status=r["status"],
                aiResponse=r["ai_response"],
                aiResponseGeneratedAt=r["ai_response_generated_at"],
                platform=r["platform"],
                createdAt=r["created_at"],
            )
            for r in reviews
        ],
    )


@router.post(
    "/bulk-approve",
    response_model=BulkApproveResponse,
    summary="리뷰 일괄 승인",
    description="여러 리뷰의 AI 응답을 한번에 확정합니다.",
)
async def bulk_approve_reviews(
    request: BulkApproveRequest,
    current_user: User = Depends(get_current_user),
    review_service: ReviewService = Depends(get_review_service),
) -> BulkApproveResponse:
    """선택한 여러 리뷰의 AI 응답을 일괄 승인합니다.

    - AI 응답이 없는 리뷰는 승인되지 않습니다
    - 다른 사용자의 샵 리뷰는 승인할 수 없습니다
    - custom_suffix를 지정하면 모든 응답 끝에 해당 문구가 추가됩니다

    Returns:
        성공/실패 개수 및 실패한 리뷰 ID 목록
    """
    result = await review_service.bulk_approve_reviews(
        user=current_user,
        review_ids=request.review_ids,
        custom_suffix=request.custom_suffix,
    )

    return BulkApproveResponse(
        successCount=result["success_count"],
        failedCount=result["failed_count"],
        failedIds=result["failed_ids"],
    )
