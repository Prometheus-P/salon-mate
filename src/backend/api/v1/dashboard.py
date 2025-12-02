"""
Dashboard API endpoints
"""

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db
from models.user import User
from services.dashboard_service import DashboardService
from services.auth_service import AuthService, AuthException
from schemas.dashboard import (
    ReviewStatsResponse,
    CalendarResponse,
    EngagementResponse,
    TrendResponse,
    PendingReviewsResponse,
    GeneratedResponseResult,
    PublishResponseRequest,
    PublishResponseResult,
    ShopsListResponse,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Validate JWT and return current user"""
    auth_service = AuthService(db)
    try:
        return await auth_service.get_current_user(credentials.credentials)
    except AuthException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


async def get_dashboard_service(db: AsyncSession = Depends(get_db)) -> DashboardService:
    """Dependency to get DashboardService instance"""
    return DashboardService(db)


async def verify_shop_access(
    shop_id: UUID,
    current_user: User = Depends(get_current_user),
    service: DashboardService = Depends(get_dashboard_service),
):
    """Verify user has access to the shop"""
    shop = await service.verify_shop_ownership(shop_id, current_user.id)
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: you do not own this shop",
        )
    return shop


# ============== User Story 1: Review Stats ==============

@router.get("/{shop_id}/stats", response_model=ReviewStatsResponse)
async def get_dashboard_stats(
    shop_id: UUID,
    _shop=Depends(verify_shop_access),
    service: DashboardService = Depends(get_dashboard_service),
):
    """
    Get review statistics for a shop.

    Returns total reviews, average rating, response rate, and pending count.
    """
    return await service.get_review_stats(shop_id)


# ============== User Story 2: Posting Calendar ==============

@router.get("/{shop_id}/calendar", response_model=CalendarResponse)
async def get_posting_calendar(
    shop_id: UUID,
    start_date: date = Query(..., description="Start date for calendar range"),
    end_date: date = Query(..., description="End date for calendar range"),
    view: str = Query("month", pattern="^(week|month)$", description="Calendar view type"),
    _shop=Depends(verify_shop_access),
    service: DashboardService = Depends(get_dashboard_service),
):
    """
    Get posting calendar entries for a date range.

    Returns posts organized by date with status indicators.
    """
    return await service.get_posting_calendar(shop_id, start_date, end_date)


# ============== User Story 3: Engagement Metrics ==============

@router.get("/{shop_id}/engagement", response_model=EngagementResponse)
async def get_engagement_metrics(
    shop_id: UUID,
    _shop=Depends(verify_shop_access),
    service: DashboardService = Depends(get_dashboard_service),
):
    """
    Get engagement metrics summary.

    Returns total likes, comments, reach, and top performing posts.
    """
    return await service.get_engagement_metrics(shop_id)


# ============== User Story 4: Trend Data ==============

@router.get("/{shop_id}/trends", response_model=TrendResponse)
async def get_trend_data(
    shop_id: UUID,
    period: str = Query(..., pattern="^(week|month|year)$", description="Time period"),
    _shop=Depends(verify_shop_access),
    service: DashboardService = Depends(get_dashboard_service),
):
    """
    Get trend data for charts.

    Returns data points for the specified time period.
    """
    return await service.get_trend_data(shop_id, period)


# ============== User Story 5: Pending Reviews & Quick Actions ==============

@router.get("/{shop_id}/pending-reviews", response_model=PendingReviewsResponse)
async def get_pending_reviews(
    shop_id: UUID,
    limit: int = Query(10, ge=1, le=50, description="Maximum reviews to return"),
    _shop=Depends(verify_shop_access),
    service: DashboardService = Depends(get_dashboard_service),
):
    """
    Get pending reviews requiring response.

    Returns reviews that need a response with quick action buttons.
    """
    return await service.get_pending_reviews(shop_id, limit)


@router.post(
    "/{shop_id}/reviews/{review_id}/generate-response",
    response_model=GeneratedResponseResult,
)
async def generate_review_response(
    shop_id: UUID,
    review_id: UUID,
    _shop=Depends(verify_shop_access),
    service: DashboardService = Depends(get_dashboard_service),
):
    """
    Generate AI response for a review.

    Returns the generated response ready for review and approval.
    """
    return await service.generate_ai_response(shop_id, review_id)


@router.post(
    "/{shop_id}/reviews/{review_id}/publish-response",
    response_model=PublishResponseResult,
)
async def publish_review_response(
    shop_id: UUID,
    review_id: UUID,
    request: PublishResponseRequest,
    _shop=Depends(verify_shop_access),
    service: DashboardService = Depends(get_dashboard_service),
):
    """
    Publish approved response to review.

    Publishes the final response and updates review status.
    """
    return await service.publish_response(shop_id, review_id, request.final_response)


# ============== Shop Selector ==============

# Note: This endpoint is at /api/v1/shops, not under /dashboard
# It will be registered separately in the shops router or here with a different prefix
