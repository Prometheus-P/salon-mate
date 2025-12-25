"""
리포트 엔드포인트 (Agency Mode)
월간 성과 리포트 생성 API
"""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db
from models.user import User
from services.auth_service import AuthException, AuthService
from services.report_service import ReportService

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


def get_report_service(db: AsyncSession = Depends(get_db)) -> ReportService:
    """리포트 서비스 의존성"""
    return ReportService(db)


@router.get(
    "/{shop_id}/monthly",
    response_class=HTMLResponse,
    summary="월간 리포트 조회",
    description="해당 매장의 월간 성과 리포트를 HTML 형식으로 반환합니다. 브라우저에서 인쇄하여 PDF로 저장할 수 있습니다.",
)
async def get_monthly_report(
    shop_id: UUID,
    year: int = Query(default=None, description="조회 년도 (기본: 현재 년도)"),
    month: int = Query(
        default=None, ge=1, le=12, description="조회 월 (기본: 현재 월)"
    ),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
) -> HTMLResponse:
    """월간 성과 리포트를 조회합니다.

    - HTML 형식으로 반환됩니다
    - 브라우저에서 Ctrl+P (Cmd+P) 로 PDF 저장 가능
    - A4 크기에 최적화되어 있습니다
    """
    # 기본값: 현재 년월
    now = datetime.now()
    if year is None:
        year = now.year
    if month is None:
        month = now.month

    try:
        data = await report_service.get_monthly_report_data(
            user=current_user,
            shop_id=shop_id,
            year=year,
            month=month,
        )
        html = report_service.generate_html_report(data)
        return HTMLResponse(content=html)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.get(
    "/{shop_id}/monthly/data",
    summary="월간 리포트 데이터 조회",
    description="월간 리포트 데이터를 JSON 형식으로 반환합니다.",
)
async def get_monthly_report_data(
    shop_id: UUID,
    year: int = Query(default=None, description="조회 년도 (기본: 현재 년도)"),
    month: int = Query(
        default=None, ge=1, le=12, description="조회 월 (기본: 현재 월)"
    ),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
) -> dict:
    """월간 리포트 데이터를 JSON으로 조회합니다.

    프론트엔드에서 커스텀 렌더링이 필요한 경우 사용합니다.
    """
    now = datetime.now()
    if year is None:
        year = now.year
    if month is None:
        month = now.month

    try:
        return await report_service.get_monthly_report_data(
            user=current_user,
            shop_id=shop_id,
            year=year,
            month=month,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
