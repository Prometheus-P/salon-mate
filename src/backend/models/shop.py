"""
매장 모델
"""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import String, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import BaseModel

if TYPE_CHECKING:
    from models.user import User


class Shop(BaseModel):
    """매장 엔티티"""

    __tablename__ = "shops"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    settings: Mapped[dict] = mapped_column(JSON, default=dict)

    # 관계
    owner: Mapped["User"] = relationship("User", back_populates="shops")

    def __repr__(self) -> str:
        return f"<Shop {self.name}>"
