"""
설정 API 엔드포인트
"""

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_db
from models.user import User
from schemas.settings import (
    IntegrationPlatform,
    IntegrationResponse,
    NotificationSettings,
    NotificationSettingsUpdate,
    PaymentHistoryItem,
    PlanType,
    SubscriptionResponse,
    TeamInviteRequest,
    TeamMemberResponse,
    TeamMemberUpdate,
)
from services.settings_service import SettingsService

router = APIRouter()


def get_settings_service(db: AsyncSession = Depends(get_db)) -> SettingsService:
    return SettingsService(db)


# ============== Profile ==============


@router.get("/profile", response_model=dict)
async def get_profile(
    current_user: User = Depends(get_current_user),
    service: SettingsService = Depends(get_settings_service),
):
    """현재 사용자 프로필 조회"""
    user = await service.get_profile(current_user.id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "phone": getattr(user, "phone", None),
        "profileImage": getattr(user, "profile_image", None),
        "createdAt": user.created_at.isoformat() if user.created_at else None,
    }


@router.patch("/profile", response_model=dict)
async def update_profile(
    data: dict[str, Any],
    current_user: User = Depends(get_current_user),
    service: SettingsService = Depends(get_settings_service),
):
    """프로필 업데이트"""
    # camelCase to snake_case conversion
    update_data = {}
    key_mapping = {
        "name": "name",
        "phone": "phone",
        "profileImage": "profile_image",
    }
    for key, value in data.items():
        if key in key_mapping:
            update_data[key_mapping[key]] = value

    user = await service.update_profile(current_user.id, update_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "phone": getattr(user, "phone", None),
        "profileImage": getattr(user, "profile_image", None),
        "createdAt": user.created_at.isoformat() if user.created_at else None,
    }


# ============== Notifications ==============


@router.get("/notifications", response_model=NotificationSettings)
async def get_notification_settings(
    current_user: User = Depends(get_current_user),
    service: SettingsService = Depends(get_settings_service),
):
    """알림 설정 조회"""
    return await service.get_notification_settings(current_user.id)


@router.patch("/notifications", response_model=NotificationSettings)
async def update_notification_settings(
    data: NotificationSettingsUpdate,
    current_user: User = Depends(get_current_user),
    service: SettingsService = Depends(get_settings_service),
):
    """알림 설정 업데이트"""
    return await service.update_notification_settings(current_user.id, data)


# ============== Integrations ==============


@router.get("/integrations", response_model=list[IntegrationResponse])
async def get_integrations(
    current_user: User = Depends(get_current_user),
    service: SettingsService = Depends(get_settings_service),
):
    """연동 목록 조회"""
    return await service.get_integrations(current_user.id)


@router.post("/integrations/{platform}", response_model=IntegrationResponse)
async def connect_integration(
    platform: IntegrationPlatform,
    current_user: User = Depends(get_current_user),
    service: SettingsService = Depends(get_settings_service),
):
    """플랫폼 연동"""
    return await service.connect_integration(current_user.id, platform)


@router.delete("/integrations/{integration_id}")
async def disconnect_integration(
    integration_id: UUID,
    current_user: User = Depends(get_current_user),
    service: SettingsService = Depends(get_settings_service),
):
    """플랫폼 연동 해제"""
    success = await service.disconnect_integration(current_user.id, integration_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Integration not found",
        )
    return {"success": True}


@router.post("/integrations/{integration_id}/sync", response_model=IntegrationResponse)
async def sync_integration(
    integration_id: UUID,
    current_user: User = Depends(get_current_user),
    service: SettingsService = Depends(get_settings_service),
):
    """플랫폼 동기화"""
    return await service.sync_integration(current_user.id, integration_id)


# ============== Subscription ==============


@router.get("/subscription", response_model=SubscriptionResponse)
async def get_subscription(
    current_user: User = Depends(get_current_user),
    service: SettingsService = Depends(get_settings_service),
):
    """구독 정보 조회"""
    return await service.get_subscription(current_user.id)


@router.get("/subscription/history", response_model=list[PaymentHistoryItem])
async def get_payment_history(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    service: SettingsService = Depends(get_settings_service),
):
    """결제 내역 조회"""
    return await service.get_payment_history(current_user.id, limit)


@router.patch("/subscription", response_model=SubscriptionResponse)
async def update_subscription(
    plan: PlanType,
    current_user: User = Depends(get_current_user),
    service: SettingsService = Depends(get_settings_service),
):
    """구독 플랜 변경"""
    return await service.update_subscription(current_user.id, plan)


# ============== Team ==============


@router.get("/team", response_model=list[TeamMemberResponse])
async def get_team_members(
    current_user: User = Depends(get_current_user),
    service: SettingsService = Depends(get_settings_service),
):
    """팀원 목록 조회"""
    return await service.get_team_members(current_user.id)


@router.post("/team/invite", response_model=TeamMemberResponse)
async def invite_team_member(
    data: TeamInviteRequest,
    current_user: User = Depends(get_current_user),
    service: SettingsService = Depends(get_settings_service),
):
    """팀원 초대"""
    return await service.invite_team_member(current_user.id, data)


@router.patch("/team/{member_id}", response_model=TeamMemberResponse)
async def update_team_member(
    member_id: UUID,
    data: TeamMemberUpdate,
    current_user: User = Depends(get_current_user),
    service: SettingsService = Depends(get_settings_service),
):
    """팀원 정보 수정"""
    member = await service.update_team_member(current_user.id, member_id, data)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found",
        )
    return member


@router.delete("/team/{member_id}")
async def remove_team_member(
    member_id: UUID,
    current_user: User = Depends(get_current_user),
    service: SettingsService = Depends(get_settings_service),
):
    """팀원 제거"""
    success = await service.remove_team_member(current_user.id, member_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found",
        )
    return {"success": True}


@router.post("/team/{member_id}/resend-invite")
async def resend_invite(
    member_id: UUID,
    current_user: User = Depends(get_current_user),
    service: SettingsService = Depends(get_settings_service),
):
    """초대 재발송"""
    success = await service.resend_invite(current_user.id, member_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found",
        )
    return {"success": True}
