"""
매장 엔드포인트
매장 CRUD API
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db
from models.user import User
from schemas.shop import (
    ShopCreate,
    ShopListResponse,
    ShopResponse,
    ShopUpdate,
)
from services.auth_service import AuthException, AuthService
from services.shop_service import ShopException, ShopService

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


def get_shop_service(db: AsyncSession = Depends(get_db)) -> ShopService:
    """매장 서비스 의존성"""
    return ShopService(db)


@router.post(
    "",
    response_model=ShopResponse,
    status_code=status.HTTP_201_CREATED,
    summary="매장 생성",
)
async def create_shop(
    shop_data: ShopCreate,
    current_user: User = Depends(get_current_user),
    shop_service: ShopService = Depends(get_shop_service),
) -> ShopResponse:
    """새 매장을 생성합니다.

    - **name**: 매장 이름 (1-100자)
    - **type**: 매장 유형 (nail, hair, skin, lash)
    - **address**: 매장 주소 (선택)
    - **phone**: 매장 전화번호 (선택)
    """
    try:
        shop = await shop_service.create_shop(current_user, shop_data)
        return ShopResponse(
            id=shop.id,
            name=shop.name,
            type=shop.type,
            address=shop.address,
            phone=shop.phone,
            createdAt=shop.created_at,
            updatedAt=shop.updated_at,
        )
    except ShopException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get(
    "",
    response_model=ShopListResponse,
    summary="매장 목록 조회",
)
async def get_shops(
    current_user: User = Depends(get_current_user),
    shop_service: ShopService = Depends(get_shop_service),
) -> ShopListResponse:
    """현재 사용자의 매장 목록을 조회합니다."""
    shops, total = await shop_service.get_user_shops(current_user)
    return ShopListResponse(
        shops=[
            ShopResponse(
                id=shop.id,
                name=shop.name,
                type=shop.type,
                address=shop.address,
                phone=shop.phone,
                createdAt=shop.created_at,
                updatedAt=shop.updated_at,
            )
            for shop in shops
        ],
        total=total,
    )


@router.get(
    "/{shop_id}",
    response_model=ShopResponse,
    summary="매장 상세 조회",
)
async def get_shop(
    shop_id: UUID,
    current_user: User = Depends(get_current_user),
    shop_service: ShopService = Depends(get_shop_service),
) -> ShopResponse:
    """매장 상세 정보를 조회합니다."""
    shop = await shop_service.get_shop_by_id(current_user, shop_id)
    if not shop:
        raise HTTPException(status_code=404, detail="매장을 찾을 수 없습니다.")

    return ShopResponse(
        id=shop.id,
        name=shop.name,
        type=shop.type,
        address=shop.address,
        phone=shop.phone,
        createdAt=shop.created_at,
        updatedAt=shop.updated_at,
    )


@router.patch(
    "/{shop_id}",
    response_model=ShopResponse,
    summary="매장 정보 수정",
)
async def update_shop(
    shop_id: UUID,
    update_data: ShopUpdate,
    current_user: User = Depends(get_current_user),
    shop_service: ShopService = Depends(get_shop_service),
) -> ShopResponse:
    """매장 정보를 수정합니다.

    - **name**: 매장 이름 (선택)
    - **address**: 매장 주소 (선택)
    - **phone**: 매장 전화번호 (선택)
    """
    try:
        shop = await shop_service.update_shop(current_user, shop_id, update_data)
        return ShopResponse(
            id=shop.id,
            name=shop.name,
            type=shop.type,
            address=shop.address,
            phone=shop.phone,
            createdAt=shop.created_at,
            updatedAt=shop.updated_at,
        )
    except ShopException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete(
    "/{shop_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="매장 삭제",
)
async def delete_shop(
    shop_id: UUID,
    current_user: User = Depends(get_current_user),
    shop_service: ShopService = Depends(get_shop_service),
) -> Response:
    """매장을 삭제합니다."""
    try:
        await shop_service.delete_shop(current_user, shop_id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except ShopException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
