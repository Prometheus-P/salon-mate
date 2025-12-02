"""
소셜 계정 모델
사용자의 OAuth 연동 정보를 저장합니다.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import GUID, Base, TimestampMixin

if TYPE_CHECKING:
    from models.user import User


class SocialAccount(Base, TimestampMixin):
    """소셜 계정 엔티티"""

    __tablename__ = "social_accounts"
    __table_args__ = (
        UniqueConstraint("provider", "provider_user_id", name="uq_provider_user"),
    )

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    provider: Mapped[str] = mapped_column(
        String(20), nullable=False, index=True
    )  # google, kakao
    provider_user_id: Mapped[str] = mapped_column(
        String(255), nullable=False
    )  # OAuth provider's user ID
    access_token: Mapped[str | None] = mapped_column(String(500), nullable=True)
    refresh_token: Mapped[str | None] = mapped_column(String(500), nullable=True)
    token_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # 관계
    user: Mapped["User"] = relationship("User", back_populates="social_accounts")

    def __repr__(self) -> str:
        return f"<SocialAccount {self.provider}:{self.provider_user_id}>"
