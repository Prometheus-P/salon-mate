"""
매장 관련 스키마
"""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

ShopType = Literal["nail", "hair", "skin", "lash"]


class ShopCreate(BaseModel):
    """매장 생성 요청"""

    name: str = Field(min_length=1, max_length=100)
    type: ShopType
    address: str | None = Field(default=None, max_length=500)
    phone: str | None = Field(default=None, max_length=20)


class ShopUpdate(BaseModel):
    """매장 수정 요청"""

    name: str | None = Field(default=None, min_length=1, max_length=100)
    address: str | None = Field(default=None, max_length=500)
    phone: str | None = Field(default=None, max_length=20)


class ShopResponse(BaseModel):
    """매장 응답"""

    id: UUID
    name: str
    type: str
    address: str | None = None
    phone: str | None = None
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    model_config = {"from_attributes": True, "populate_by_name": True}


class ShopListResponse(BaseModel):
    """매장 목록 응답"""

    shops: list[ShopResponse]
    total: int
