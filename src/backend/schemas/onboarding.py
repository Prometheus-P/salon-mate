"""
온보딩 관련 스키마
"""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

# ============== Onboarding Step ==============

OnboardingStep = Literal["welcome", "profile", "shop", "integrations", "complete"]


class OnboardingStatus(BaseModel):
    """온보딩 상태"""

    user_id: UUID = Field(alias="userId")
    current_step: OnboardingStep = Field(alias="currentStep")
    completed_steps: list[OnboardingStep] = Field(
        default_factory=list, alias="completedSteps"
    )
    is_completed: bool = Field(default=False, alias="isCompleted")
    started_at: datetime = Field(alias="startedAt")
    completed_at: datetime | None = Field(default=None, alias="completedAt")

    model_config = {"populate_by_name": True}


class OnboardingStepUpdate(BaseModel):
    """온보딩 스텝 업데이트"""

    step: OnboardingStep
    data: dict | None = None  # Step-specific data


# ============== Profile Step ==============


class ProfileStepData(BaseModel):
    """프로필 스텝 데이터"""

    name: str = Field(min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    profile_image: str | None = Field(default=None, alias="profileImage")

    model_config = {"populate_by_name": True}


# ============== Shop Step ==============


class ShopStepData(BaseModel):
    """샵 스텝 데이터"""

    name: str = Field(min_length=1, max_length=100)
    business_type: Literal["hairsalon", "nailshop", "skincare", "barbershop", "other"] = Field(
        alias="businessType"
    )
    address: str | None = None
    phone: str | None = None
    operating_hours: str | None = Field(default=None, alias="operatingHours")

    model_config = {"populate_by_name": True}


class ShopResponse(BaseModel):
    """샵 응답"""

    id: UUID
    name: str
    business_type: str = Field(alias="businessType")
    address: str | None = None
    phone: str | None = None

    model_config = {"from_attributes": True, "populate_by_name": True}


# ============== Integration Step ==============


class IntegrationSelection(BaseModel):
    """연동 선택"""

    platform: Literal["google", "naver", "instagram"]
    selected: bool = True


class IntegrationStepData(BaseModel):
    """연동 스텝 데이터"""

    integrations: list[IntegrationSelection]
    skip_all: bool = Field(default=False, alias="skipAll")

    model_config = {"populate_by_name": True}


# ============== Email Verification ==============


class EmailVerificationRequest(BaseModel):
    """이메일 인증 요청"""

    email: str


class EmailVerificationConfirm(BaseModel):
    """이메일 인증 확인"""

    email: str
    code: str = Field(min_length=6, max_length=6)


class EmailVerificationResponse(BaseModel):
    """이메일 인증 응답"""

    email: str
    is_verified: bool = Field(alias="isVerified")
    verified_at: datetime | None = Field(default=None, alias="verifiedAt")

    model_config = {"populate_by_name": True}


# ============== Complete Response ==============


class OnboardingCompleteResponse(BaseModel):
    """온보딩 완료 응답"""

    user_id: UUID = Field(alias="userId")
    shop_id: UUID = Field(alias="shopId")
    profile_completed: bool = Field(alias="profileCompleted")
    shop_created: bool = Field(alias="shopCreated")
    integrations_connected: int = Field(alias="integrationsConnected")
    completed_at: datetime = Field(alias="completedAt")

    model_config = {"populate_by_name": True}
