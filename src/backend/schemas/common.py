"""
공통 스키마 정의
"""

from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ApiMeta(BaseModel):
    """API 메타데이터"""

    request_id: str = Field(alias="requestId")
    timestamp: datetime


class ApiResponse(BaseModel, Generic[T]):
    """API 성공 응답"""

    data: T
    meta: ApiMeta


class ApiError(BaseModel):
    """API 에러 상세"""

    code: str
    message: str
    details: dict | None = None


class ApiErrorResponse(BaseModel):
    """API 에러 응답"""

    error: ApiError
    meta: ApiMeta


class PaginationMeta(BaseModel):
    """페이지네이션 메타데이터"""

    page: int
    page_size: int = Field(alias="pageSize")
    total_items: int = Field(alias="totalItems")
    total_pages: int = Field(alias="totalPages")
    has_next: bool = Field(alias="hasNext")
    has_prev: bool = Field(alias="hasPrev")


class PaginatedResponse(BaseModel, Generic[T]):
    """페이지네이션 응답"""

    data: list[T]
    meta: ApiMeta
    pagination: PaginationMeta
