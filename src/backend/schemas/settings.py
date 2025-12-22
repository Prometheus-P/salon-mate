"""
설정 관련 스키마
"""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


# ============== Notification Settings ==============

class NotificationChannels(BaseModel):
    """알림 채널 설정"""

    email: bool = True
    push: bool = True
    kakao: bool = False


class NotificationType(BaseModel):
    """알림 유형별 설정"""

    email: bool = True
    push: bool = True
    kakao: bool = False


class NotificationSettings(BaseModel):
    """알림 설정"""

    channels: NotificationChannels
    new_review: NotificationType = Field(alias="newReview")
    negative_review: NotificationType = Field(alias="negativeReview")
    review_response_complete: NotificationType = Field(alias="reviewResponseComplete")
    post_published: NotificationType = Field(alias="postPublished")
    post_failed: NotificationType = Field(alias="postFailed")
    weekly_report: NotificationType = Field(alias="weeklyReport")
    monthly_report: NotificationType = Field(alias="monthlyReport")
    quiet_hours_enabled: bool = Field(default=False, alias="quietHoursEnabled")
    quiet_hours_start: str = Field(default="22:00", alias="quietHoursStart")
    quiet_hours_end: str = Field(default="08:00", alias="quietHoursEnd")

    model_config = {"populate_by_name": True}


class NotificationSettingsUpdate(BaseModel):
    """알림 설정 업데이트"""

    channels: NotificationChannels | None = None
    new_review: NotificationType | None = Field(default=None, alias="newReview")
    negative_review: NotificationType | None = Field(default=None, alias="negativeReview")
    review_response_complete: NotificationType | None = Field(
        default=None, alias="reviewResponseComplete"
    )
    post_published: NotificationType | None = Field(default=None, alias="postPublished")
    post_failed: NotificationType | None = Field(default=None, alias="postFailed")
    weekly_report: NotificationType | None = Field(default=None, alias="weeklyReport")
    monthly_report: NotificationType | None = Field(default=None, alias="monthlyReport")
    quiet_hours_enabled: bool | None = Field(default=None, alias="quietHoursEnabled")
    quiet_hours_start: str | None = Field(default=None, alias="quietHoursStart")
    quiet_hours_end: str | None = Field(default=None, alias="quietHoursEnd")

    model_config = {"populate_by_name": True}


# ============== Integration ==============

IntegrationPlatform = Literal["google", "naver", "kakao", "instagram", "facebook", "openai"]
IntegrationStatus = Literal["connected", "disconnected", "error", "syncing"]


class IntegrationResponse(BaseModel):
    """연동 응답"""

    id: UUID
    platform: IntegrationPlatform
    status: IntegrationStatus
    account_name: str | None = Field(default=None, alias="accountName")
    last_synced_at: datetime | None = Field(default=None, alias="lastSyncedAt")
    error_message: str | None = Field(default=None, alias="errorMessage")
    created_at: datetime = Field(alias="createdAt")

    model_config = {"from_attributes": True, "populate_by_name": True}


class IntegrationSettingsUpdate(BaseModel):
    """연동 설정 업데이트"""

    sync_interval: Literal["15min", "1hour", "manual"] = Field(
        default="15min", alias="syncInterval"
    )
    notify_new_review: bool = Field(default=True, alias="notifyNewReview")
    notify_negative_review: bool = Field(default=True, alias="notifyNegativeReview")

    model_config = {"populate_by_name": True}


# ============== Subscription ==============

PlanType = Literal["free", "pro", "enterprise"]


class PlanFeatures(BaseModel):
    """플랜 기능"""

    review_limit: int | None = Field(alias="reviewLimit")  # None = unlimited
    ai_response_limit: int = Field(alias="aiResponseLimit")
    post_limit: int | None = Field(alias="postLimit")  # None = unlimited
    team_member_limit: int = Field(alias="teamMemberLimit")
    analytics: Literal["basic", "detailed", "custom"]
    support: Literal["email", "priority", "dedicated"]

    model_config = {"populate_by_name": True}


class UsageResponse(BaseModel):
    """사용량 응답"""

    ai_responses_used: int = Field(alias="aiResponsesUsed")
    ai_responses_limit: int = Field(alias="aiResponsesLimit")
    team_members_used: int = Field(alias="teamMembersUsed")
    team_members_limit: int = Field(alias="teamMembersLimit")
    shops_count: int = Field(alias="shopsCount")

    model_config = {"populate_by_name": True}


class SubscriptionResponse(BaseModel):
    """구독 응답"""

    id: UUID
    plan: PlanType
    price: int
    billing_cycle: Literal["monthly", "yearly"] = Field(alias="billingCycle")
    next_billing_date: datetime | None = Field(default=None, alias="nextBillingDate")
    features: PlanFeatures
    usage: UsageResponse
    payment_method: str | None = Field(default=None, alias="paymentMethod")
    payment_last_four: str | None = Field(default=None, alias="paymentLastFour")

    model_config = {"populate_by_name": True}


class PaymentHistoryItem(BaseModel):
    """결제 내역 항목"""

    id: UUID
    date: datetime
    description: str
    amount: int
    status: Literal["completed", "pending", "failed"]
    receipt_url: str | None = Field(default=None, alias="receiptUrl")

    model_config = {"populate_by_name": True}


# ============== Team ==============

TeamRole = Literal["owner", "admin", "member"]


class TeamMemberResponse(BaseModel):
    """팀원 응답"""

    id: UUID
    user_id: UUID = Field(alias="userId")
    email: str
    name: str
    role: TeamRole
    shop_access: list[UUID] = Field(alias="shopAccess")
    joined_at: datetime = Field(alias="joinedAt")
    is_pending: bool = Field(default=False, alias="isPending")

    model_config = {"populate_by_name": True}


class TeamInviteRequest(BaseModel):
    """팀원 초대 요청"""

    email: str
    role: TeamRole = "member"
    shop_access: list[UUID] = Field(default_factory=list, alias="shopAccess")

    model_config = {"populate_by_name": True}


class TeamMemberUpdate(BaseModel):
    """팀원 업데이트"""

    role: TeamRole | None = None
    shop_access: list[UUID] | None = Field(default=None, alias="shopAccess")

    model_config = {"populate_by_name": True}
