"""
인증 관련 스키마
"""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """사용자 기본 정보"""

    email: EmailStr
    name: str = Field(min_length=2, max_length=100)


class UserCreate(UserBase):
    """회원가입 요청"""

    password: str = Field(min_length=8, max_length=100)
    shop_name: str | None = Field(default=None, alias="shopName")
    shop_type: Literal["nail", "hair", "skin", "lash"] | None = Field(
        default=None, alias="shopType"
    )


class UserLogin(BaseModel):
    """로그인 요청"""

    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """사용자 응답"""

    id: UUID
    email: EmailStr
    name: str
    created_at: datetime = Field(alias="createdAt")

    model_config = {"from_attributes": True, "populate_by_name": True}


class TokenResponse(BaseModel):
    """토큰 응답"""

    access_token: str = Field(alias="accessToken")
    refresh_token: str = Field(alias="refreshToken")
    expires_in: int = Field(alias="expiresIn")

    model_config = {"populate_by_name": True}


class AuthResponse(BaseModel):
    """인증 응답"""

    user: UserResponse
    access_token: str = Field(alias="accessToken")
    refresh_token: str = Field(alias="refreshToken")
    expires_in: int = Field(alias="expiresIn")

    model_config = {"populate_by_name": True}


class RefreshTokenRequest(BaseModel):
    """토큰 갱신 요청"""

    refresh_token: str = Field(alias="refreshToken")


class AccessTokenResponse(BaseModel):
    """액세스 토큰 응답"""

    access_token: str = Field(alias="accessToken")
    expires_in: int = Field(alias="expiresIn")

    model_config = {"populate_by_name": True}
