"""
설정 관련 서비스
"""

from datetime import datetime, timedelta
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.user import User
from schemas.settings import (
    IntegrationPlatform,
    IntegrationResponse,
    NotificationChannels,
    NotificationSettings,
    NotificationSettingsUpdate,
    NotificationType,
    PaymentHistoryItem,
    PlanFeatures,
    PlanType,
    SubscriptionResponse,
    TeamInviteRequest,
    TeamMemberResponse,
    TeamMemberUpdate,
    UsageResponse,
)


class SettingsService:
    """설정 서비스"""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ============== Profile ==============

    async def get_profile(self, user_id: UUID) -> User | None:
        """사용자 프로필 조회"""
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def update_profile(
        self, user_id: UUID, data: dict[str, Any]
    ) -> User | None:
        """프로필 업데이트"""
        user = await self.get_profile(user_id)
        if not user:
            return None

        for key, value in data.items():
            if hasattr(user, key) and value is not None:
                setattr(user, key, value)

        user.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(user)
        return user

    # ============== Notifications ==============

    async def get_notification_settings(self, user_id: UUID) -> NotificationSettings:
        """알림 설정 조회 (Mock)"""
        # TODO: DB에서 실제 설정 조회
        return NotificationSettings(
            channels=NotificationChannels(email=True, push=True, kakao=False),
            newReview=NotificationType(email=True, push=True, kakao=False),
            negativeReview=NotificationType(email=True, push=True, kakao=False),
            reviewResponseComplete=NotificationType(email=True, push=False, kakao=False),
            postPublished=NotificationType(email=False, push=True, kakao=False),
            postFailed=NotificationType(email=True, push=True, kakao=False),
            weeklyReport=NotificationType(email=True, push=False, kakao=False),
            monthlyReport=NotificationType(email=True, push=False, kakao=False),
            quietHoursEnabled=False,
            quietHoursStart="22:00",
            quietHoursEnd="08:00",
        )

    async def update_notification_settings(
        self, user_id: UUID, data: NotificationSettingsUpdate
    ) -> NotificationSettings:
        """알림 설정 업데이트 (Mock)"""
        # TODO: DB에 실제 설정 저장
        current = await self.get_notification_settings(user_id)

        # 업데이트 적용
        update_data = data.model_dump(exclude_unset=True, by_alias=True)
        current_data = current.model_dump(by_alias=True)
        current_data.update(update_data)

        return NotificationSettings(**current_data)

    # ============== Integrations ==============

    async def get_integrations(self, user_id: UUID) -> list[IntegrationResponse]:
        """연동 목록 조회 (Mock)"""
        # TODO: DB에서 실제 연동 정보 조회
        now = datetime.utcnow()
        return [
            IntegrationResponse(
                id=uuid4(),
                platform="google",
                status="connected",
                accountName="내 미용실",
                lastSyncedAt=now - timedelta(minutes=15),
                errorMessage=None,
                createdAt=now - timedelta(days=30),
            ),
            IntegrationResponse(
                id=uuid4(),
                platform="naver",
                status="connected",
                accountName="헤어샵",
                lastSyncedAt=now - timedelta(hours=1),
                errorMessage=None,
                createdAt=now - timedelta(days=25),
            ),
            IntegrationResponse(
                id=uuid4(),
                platform="instagram",
                status="disconnected",
                accountName=None,
                lastSyncedAt=None,
                errorMessage=None,
                createdAt=now - timedelta(days=20),
            ),
            IntegrationResponse(
                id=uuid4(),
                platform="kakao",
                status="error",
                accountName="카카오 플레이스",
                lastSyncedAt=now - timedelta(days=2),
                errorMessage="인증이 만료되었습니다. 다시 연결해주세요.",
                createdAt=now - timedelta(days=15),
            ),
        ]

    async def connect_integration(
        self, user_id: UUID, platform: IntegrationPlatform
    ) -> IntegrationResponse:
        """플랫폼 연동 (Mock)"""
        # TODO: 실제 OAuth 플로우 구현
        return IntegrationResponse(
            id=uuid4(),
            platform=platform,
            status="syncing",
            accountName=None,
            lastSyncedAt=None,
            errorMessage=None,
            createdAt=datetime.utcnow(),
        )

    async def disconnect_integration(
        self, user_id: UUID, integration_id: UUID
    ) -> bool:
        """플랫폼 연동 해제 (Mock)"""
        # TODO: 실제 연동 해제 구현
        return True

    async def sync_integration(
        self, user_id: UUID, integration_id: UUID
    ) -> IntegrationResponse:
        """플랫폼 동기화 (Mock)"""
        # TODO: 실제 동기화 구현
        return IntegrationResponse(
            id=integration_id,
            platform="google",
            status="syncing",
            accountName="내 미용실",
            lastSyncedAt=datetime.utcnow(),
            errorMessage=None,
            createdAt=datetime.utcnow() - timedelta(days=30),
        )

    # ============== Subscription ==============

    async def get_subscription(self, user_id: UUID) -> SubscriptionResponse:
        """구독 정보 조회 (Mock)"""
        # TODO: DB에서 실제 구독 정보 조회
        return SubscriptionResponse(
            id=uuid4(),
            plan="pro",
            price=29000,
            billingCycle="monthly",
            nextBillingDate=datetime.utcnow() + timedelta(days=15),
            features=PlanFeatures(
                reviewLimit=None,  # Unlimited
                aiResponseLimit=500,
                postLimit=None,  # Unlimited
                teamMemberLimit=5,
                analytics="detailed",
                support="priority",
            ),
            usage=UsageResponse(
                aiResponsesUsed=127,
                aiResponsesLimit=500,
                teamMembersUsed=3,
                teamMembersLimit=5,
                shopsCount=2,
            ),
            paymentMethod="card",
            paymentLastFour="4242",
        )

    async def get_payment_history(
        self, user_id: UUID, limit: int = 10
    ) -> list[PaymentHistoryItem]:
        """결제 내역 조회 (Mock)"""
        # TODO: DB에서 실제 결제 내역 조회
        now = datetime.utcnow()
        return [
            PaymentHistoryItem(
                id=uuid4(),
                date=now - timedelta(days=i * 30),
                description=f"Pro 플랜 - {"연간" if i == 0 else "월간"} 구독",
                amount=29000,
                status="completed",
                receiptUrl=f"https://example.com/receipts/{uuid4()}",
            )
            for i in range(min(limit, 6))
        ]

    async def update_subscription(
        self, user_id: UUID, plan: PlanType
    ) -> SubscriptionResponse:
        """구독 플랜 변경 (Mock)"""
        # TODO: 실제 구독 플랜 변경 구현
        prices = {"free": 0, "pro": 29000, "enterprise": 99000}
        return SubscriptionResponse(
            id=uuid4(),
            plan=plan,
            price=prices[plan],
            billingCycle="monthly",
            nextBillingDate=datetime.utcnow() + timedelta(days=30),
            features=self._get_plan_features(plan),
            usage=UsageResponse(
                aiResponsesUsed=127,
                aiResponsesLimit=self._get_plan_features(plan).ai_response_limit,
                teamMembersUsed=3,
                teamMembersLimit=self._get_plan_features(plan).team_member_limit,
                shopsCount=2,
            ),
            paymentMethod="card",
            paymentLastFour="4242",
        )

    def _get_plan_features(self, plan: PlanType) -> PlanFeatures:
        """플랜별 기능 반환"""
        if plan == "free":
            return PlanFeatures(
                reviewLimit=50,
                aiResponseLimit=10,
                postLimit=5,
                teamMemberLimit=1,
                analytics="basic",
                support="email",
            )
        elif plan == "pro":
            return PlanFeatures(
                reviewLimit=None,
                aiResponseLimit=500,
                postLimit=None,
                teamMemberLimit=5,
                analytics="detailed",
                support="priority",
            )
        else:  # enterprise
            return PlanFeatures(
                reviewLimit=None,
                aiResponseLimit=9999,
                postLimit=None,
                teamMemberLimit=50,
                analytics="custom",
                support="dedicated",
            )

    # ============== Team ==============

    async def get_team_members(self, user_id: UUID) -> list[TeamMemberResponse]:
        """팀원 목록 조회 (Mock)"""
        # TODO: DB에서 실제 팀원 목록 조회
        now = datetime.utcnow()
        return [
            TeamMemberResponse(
                id=uuid4(),
                userId=user_id,
                email="owner@example.com",
                name="김대표",
                role="owner",
                shopAccess=[],  # All shops
                joinedAt=now - timedelta(days=365),
                isPending=False,
            ),
            TeamMemberResponse(
                id=uuid4(),
                userId=uuid4(),
                email="manager@example.com",
                name="이매니저",
                role="admin",
                shopAccess=[uuid4()],
                joinedAt=now - timedelta(days=180),
                isPending=False,
            ),
            TeamMemberResponse(
                id=uuid4(),
                userId=uuid4(),
                email="staff@example.com",
                name="박스태프",
                role="member",
                shopAccess=[uuid4()],
                joinedAt=now - timedelta(days=30),
                isPending=False,
            ),
            TeamMemberResponse(
                id=uuid4(),
                userId=uuid4(),
                email="pending@example.com",
                name="신입사원",
                role="member",
                shopAccess=[],
                joinedAt=now,
                isPending=True,
            ),
        ]

    async def invite_team_member(
        self, user_id: UUID, data: TeamInviteRequest
    ) -> TeamMemberResponse:
        """팀원 초대 (Mock)"""
        # TODO: 실제 초대 이메일 발송 및 DB 저장
        return TeamMemberResponse(
            id=uuid4(),
            userId=uuid4(),
            email=data.email,
            name=data.email.split("@")[0],
            role=data.role,
            shopAccess=data.shop_access,
            joinedAt=datetime.utcnow(),
            isPending=True,
        )

    async def update_team_member(
        self, user_id: UUID, member_id: UUID, data: TeamMemberUpdate
    ) -> TeamMemberResponse | None:
        """팀원 정보 수정 (Mock)"""
        # TODO: 실제 팀원 정보 업데이트
        return TeamMemberResponse(
            id=member_id,
            userId=uuid4(),
            email="updated@example.com",
            name="업데이트된 사용자",
            role=data.role or "member",
            shopAccess=data.shop_access or [],
            joinedAt=datetime.utcnow() - timedelta(days=30),
            isPending=False,
        )

    async def remove_team_member(
        self, user_id: UUID, member_id: UUID
    ) -> bool:
        """팀원 제거 (Mock)"""
        # TODO: 실제 팀원 제거
        return True

    async def resend_invite(
        self, user_id: UUID, member_id: UUID
    ) -> bool:
        """초대 재발송 (Mock)"""
        # TODO: 실제 초대 이메일 재발송
        return True
