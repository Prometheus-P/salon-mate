"""API v1 router module."""

from fastapi import APIRouter

from api.v1.auth import router as auth_router
from api.v1.health import router as health_router
from api.v1.reviews import router as reviews_router
from api.v1.shops import router as shops_router
from api.v1.users import router as users_router

router = APIRouter()

router.include_router(health_router, tags=["health"])
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(users_router, prefix="/users", tags=["users"])
router.include_router(shops_router, prefix="/shops", tags=["shops"])
router.include_router(
    reviews_router, prefix="/shops/{shop_id}/reviews", tags=["reviews"]
)
