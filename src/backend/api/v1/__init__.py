"""API v1 router module."""

from fastapi import APIRouter

from api.v1.auth import router as auth_router
from api.v1.dashboard import router as dashboard_router
from api.v1.health import router as health_router
from api.v1.inbox import router as inbox_router
from api.v1.instagram import router as instagram_router
from api.v1.onboarding import router as onboarding_router
from api.v1.posts import router as posts_router
from api.v1.reports import router as reports_router
from api.v1.reviews import router as reviews_router
from api.v1.settings import router as settings_router
from api.v1.shops import router as shops_router
from api.v1.styles import router as styles_router
from api.v1.users import router as users_router

router = APIRouter()

router.include_router(health_router, tags=["health"])
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(users_router, prefix="/users", tags=["users"])
router.include_router(shops_router, prefix="/shops", tags=["shops"])
router.include_router(
    reviews_router, prefix="/shops/{shop_id}/reviews", tags=["reviews"]
)
router.include_router(posts_router, prefix="/shops/{shop_id}/posts", tags=["posts"])
router.include_router(dashboard_router)
router.include_router(settings_router, prefix="/settings", tags=["settings"])
router.include_router(onboarding_router, prefix="/onboarding", tags=["onboarding"])
router.include_router(instagram_router, prefix="/instagram", tags=["instagram"])
router.include_router(styles_router, prefix="/shops/{shop_id}/styles", tags=["styles"])
router.include_router(inbox_router, prefix="/inbox", tags=["inbox"])
router.include_router(reports_router, prefix="/reports", tags=["reports"])
