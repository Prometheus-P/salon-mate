"""
헬스 체크 엔드포인트
"""

from fastapi import APIRouter

from config.settings import get_settings

router = APIRouter()
settings = get_settings()


@router.get("/health")
async def health_check() -> dict[str, str]:
    """API 헬스 체크"""
    return {
        "status": "healthy",
        "version": settings.app_version,
        "environment": settings.environment,
    }
