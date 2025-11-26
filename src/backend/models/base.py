"""
SQLAlchemy 모델 베이스 클래스 및 공통 믹스인
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from config.database import Base


class TimestampMixin:
    """타임스탬프 믹스인 (created_at, updated_at)"""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class UUIDMixin:
    """UUID 기본 키 믹스인"""

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )


class BaseModel(Base, UUIDMixin, TimestampMixin):
    """모든 모델의 베이스 클래스"""

    __abstract__ = True
