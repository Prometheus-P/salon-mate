"""
AI 응답 관련 스키마
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class AIResponseRequest(BaseModel):
    """AI 답변 생성 요청"""

    tone: Literal["friendly", "formal", "casual"] | None = Field(default="friendly")
    include_shop_name: bool = Field(default=False, alias="includeShopName")
    max_length: int = Field(default=500, ge=50, le=1000, alias="maxLength")

    model_config = {"populate_by_name": True}


class AIResponseResult(BaseModel):
    """AI 답변 생성 결과"""

    ai_response: str = Field(alias="aiResponse")
    generated_at: datetime = Field(alias="generatedAt")

    model_config = {"populate_by_name": True}
