"""
사용자 모델
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import BaseModel

if TYPE_CHECKING:
    from models.shop import Shop
    from models.social_account import SocialAccount


class User(BaseModel):
    """사용자 엔티티"""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    auth_provider: Mapped[str] = mapped_column(
        String(20), nullable=False, default="email"
    )
    email_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # 관계
    shops: Mapped[list["Shop"]] = relationship(
        "Shop", back_populates="owner", cascade="all, delete-orphan"
    )
    social_accounts: Mapped[list["SocialAccount"]] = relationship(
        "SocialAccount", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User {self.email}>"
