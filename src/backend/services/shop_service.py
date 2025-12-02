"""
매장 서비스
매장 CRUD 비즈니스 로직
"""

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.shop import Shop
from models.user import User
from schemas.shop import ShopCreate, ShopUpdate


class ShopException(Exception):
    """매장 관련 예외"""

    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class ShopService:
    """매장 서비스"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_shop(self, user: User, shop_data: ShopCreate) -> Shop:
        """새 매장을 생성합니다."""
        shop = Shop(
            user_id=user.id,
            name=shop_data.name,
            type=shop_data.type,
            address=shop_data.address,
            phone=shop_data.phone,
        )

        self.db.add(shop)
        await self.db.commit()
        await self.db.refresh(shop)
        return shop

    async def get_user_shops(self, user: User) -> tuple[list[Shop], int]:
        """사용자의 매장 목록을 조회합니다."""
        # 매장 목록 조회
        result = await self.db.execute(
            select(Shop).where(Shop.user_id == user.id).order_by(Shop.created_at.desc())
        )
        shops = list(result.scalars().all())

        # 총 개수
        count_result = await self.db.execute(
            select(func.count()).select_from(Shop).where(Shop.user_id == user.id)
        )
        total = count_result.scalar() or 0

        return shops, total

    async def get_shop_by_id(self, user: User, shop_id: UUID) -> Shop | None:
        """매장 ID로 매장을 조회합니다. 해당 사용자의 매장만 반환합니다."""
        result = await self.db.execute(
            select(Shop).where(Shop.id == shop_id).where(Shop.user_id == user.id)
        )
        return result.scalar_one_or_none()

    async def update_shop(
        self, user: User, shop_id: UUID, update_data: ShopUpdate
    ) -> Shop:
        """매장 정보를 수정합니다."""
        shop = await self.get_shop_by_id(user, shop_id)
        if not shop:
            raise ShopException("매장을 찾을 수 없습니다.", status_code=404)

        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            if value is not None:
                setattr(shop, field, value)

        await self.db.commit()
        await self.db.refresh(shop)
        return shop

    async def delete_shop(self, user: User, shop_id: UUID) -> None:
        """매장을 삭제합니다."""
        shop = await self.get_shop_by_id(user, shop_id)
        if not shop:
            raise ShopException("매장을 찾을 수 없습니다.", status_code=404)

        await self.db.delete(shop)
        await self.db.commit()
