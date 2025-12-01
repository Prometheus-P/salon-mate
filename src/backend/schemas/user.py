"""
사용자 관련 스키마
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, HttpUrl


class UserProfileResponse(BaseModel):
    """사용자 프로필 응답"""

    id: UUID
    email: EmailStr
    name: str
    avatar_url: str | None = Field(default=None, alias="avatarUrl")
    auth_provider: str = Field(alias="authProvider")
    created_at: datetime = Field(alias="createdAt")

    model_config = {"from_attributes": True, "populate_by_name": True}


class UserProfileUpdate(BaseModel):
    """사용자 프로필 수정 요청"""

    name: str | None = Field(default=None, min_length=2, max_length=100)
    avatar_url: str | None = Field(default=None, alias="avatarUrl")

    model_config = {"populate_by_name": True}


class ChangePasswordRequest(BaseModel):
    """비밀번호 변경 요청"""

    current_password: str = Field(alias="currentPassword")
    new_password: str = Field(min_length=8, max_length=100, alias="newPassword")

    model_config = {"populate_by_name": True}


class MessageResponse(BaseModel):
    """메시지 응답"""

    message: str
