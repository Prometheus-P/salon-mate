"""
사용자 서비스
프로필 조회/수정, 비밀번호 변경 등
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import hash_password, verify_password
from models.user import User
from schemas.user import UserProfileUpdate


class UserException(Exception):
    """사용자 관련 예외"""

    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class UserService:
    """사용자 서비스"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_by_id(self, user_id: UUID) -> User | None:
        """ID로 사용자를 조회합니다."""
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def update_profile(self, user: User, update_data: UserProfileUpdate) -> User:
        """사용자 프로필을 수정합니다."""
        update_dict = update_data.model_dump(exclude_unset=True, by_alias=False)

        for field, value in update_dict.items():
            if hasattr(user, field) and value is not None:
                setattr(user, field, value)

        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def change_password(
        self, user: User, current_password: str, new_password: str
    ) -> None:
        """비밀번호를 변경합니다."""
        # 소셜 로그인 사용자 확인
        if user.auth_provider != "email":
            raise UserException(
                "소셜 로그인 사용자는 비밀번호를 변경할 수 없습니다.",
                status_code=400,
            )

        # 현재 비밀번호 확인
        if not user.password_hash:
            raise UserException(
                "비밀번호가 설정되지 않은 계정입니다.",
                status_code=400,
            )

        if not verify_password(current_password, user.password_hash):
            raise UserException(
                "현재 비밀번호가 올바르지 않습니다.",
                status_code=400,
            )

        # 새 비밀번호 해싱 및 저장
        user.password_hash = hash_password(new_password)
        await self.db.commit()
