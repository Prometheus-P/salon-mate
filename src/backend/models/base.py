"""
SQLAlchemy 모델 베이스 클래스 및 공통 믹스인
"""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, String, func, TypeDecorator
from sqlalchemy.orm import Mapped, mapped_column

from config.database import Base


class GUID(TypeDecorator):
    """Platform-independent GUID type.

    Uses String(36), storing as stringified UUID.
    Returns UUID objects from the column.
    """
    impl = String(36)
    cache_ok = True

    def process_bind_param(self, value: Any, dialect: Any) -> str | None:
        if value is not None:
            if isinstance(value, uuid.UUID):
                return str(value)
            return str(uuid.UUID(value))
        return None

    def process_result_value(self, value: Any, dialect: Any) -> uuid.UUID | None:
        if value is not None:
            if isinstance(value, uuid.UUID):
                return value
            return uuid.UUID(value)
        return None


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
        GUID(),
        primary_key=True,
        default=uuid.uuid4,
    )


class BaseModel(Base, UUIDMixin, TimestampMixin):
    """모든 모델의 베이스 클래스"""

    __abstract__ = True
