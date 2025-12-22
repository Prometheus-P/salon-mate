"""
매장 모델
"""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import JSON, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import GUID, BaseModel

if TYPE_CHECKING:
    from models.post import Post
    from models.review import Review
    from models.style_tag import StyleTag
    from models.user import User


class Shop(BaseModel):
    """매장 엔티티"""

    __tablename__ = "shops"

    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
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
    reviews: Mapped[list["Review"]] = relationship(
        "Review", back_populates="shop", cascade="all, delete-orphan"
    )
    posts: Mapped[list["Post"]] = relationship(
        "Post", back_populates="shop", cascade="all, delete-orphan"
    )
    style_tags: Mapped[list["StyleTag"]] = relationship(
        "StyleTag", back_populates="shop", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Shop {self.name}>"
