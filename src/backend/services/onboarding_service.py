"""
온보딩 서비스
"""

import random
import string
from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.shop import Shop
from models.user import User
from schemas.onboarding import (
    EmailVerificationResponse,
    IntegrationStepData,
    OnboardingCompleteResponse,
    OnboardingStatus,
    OnboardingStep,
    ProfileStepData,
    ShopResponse,
    ShopStepData,
)


class OnboardingService:
    """온보딩 서비스"""

    def __init__(self, db: AsyncSession):
        self.db = db
        # In-memory storage for verification codes (use Redis in production)
        self._verification_codes: dict[str, str] = {}

    # ============== Status ==============

    async def get_status(self, user_id: UUID) -> OnboardingStatus:
        """온보딩 상태 조회"""
        # TODO: DB에서 실제 상태 조회
        # For now, return mock status
        return OnboardingStatus(
            userId=user_id,
            currentStep="welcome",
            completedSteps=[],
            isCompleted=False,
            startedAt=datetime.utcnow(),
            completedAt=None,
        )

    async def update_step(
        self,
        user_id: UUID,
        step: OnboardingStep,
        data: dict[str, Any] | None = None,
    ) -> OnboardingStatus:
        """온보딩 스텝 업데이트"""
        # Get current status
        status = await self.get_status(user_id)

        # Process step data
        if step == "profile" and data:
            await self._process_profile_step(user_id, ProfileStepData(**data))
        elif step == "shop" and data:
            await self._process_shop_step(user_id, ShopStepData(**data))
        elif step == "integrations" and data:
            await self._process_integration_step(user_id, IntegrationStepData(**data))

        # Update completed steps
        completed_steps = list(status.completed_steps)
        if step not in completed_steps:
            completed_steps.append(step)

        # Determine next step
        step_order: list[OnboardingStep] = [
            "welcome",
            "profile",
            "shop",
            "integrations",
            "complete",
        ]
        current_idx = step_order.index(step)
        next_step = step_order[current_idx + 1] if current_idx < len(step_order) - 1 else "complete"

        is_completed = next_step == "complete"

        return OnboardingStatus(
            userId=user_id,
            currentStep=next_step,
            completedSteps=completed_steps,
            isCompleted=is_completed,
            startedAt=status.started_at,
            completedAt=datetime.utcnow() if is_completed else None,
        )

    async def _process_profile_step(
        self, user_id: UUID, data: ProfileStepData
    ) -> None:
        """프로필 스텝 처리"""
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user:
            user.name = data.name
            if data.phone:
                user.phone = data.phone
            if data.profile_image:
                user.profile_image = data.profile_image
            user.updated_at = datetime.utcnow()
            await self.db.commit()

    async def _process_shop_step(
        self, user_id: UUID, data: ShopStepData
    ) -> ShopResponse:
        """샵 스텝 처리"""
        shop = Shop(
            id=uuid4(),
            owner_id=user_id,
            name=data.name,
            business_type=data.business_type,
            address=data.address,
            phone=data.phone,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        self.db.add(shop)
        await self.db.commit()
        await self.db.refresh(shop)

        return ShopResponse(
            id=shop.id,
            name=shop.name,
            businessType=shop.business_type,
            address=shop.address,
            phone=shop.phone,
        )

    async def _process_integration_step(
        self, user_id: UUID, data: IntegrationStepData
    ) -> int:
        """연동 스텝 처리"""
        if data.skip_all:
            return 0

        # Count selected integrations
        selected_count = sum(1 for i in data.integrations if i.selected)
        # TODO: Actually initiate OAuth flows for selected platforms
        return selected_count

    # ============== Email Verification ==============

    async def send_verification_email(self, email: str) -> bool:
        """인증 이메일 발송"""
        # Generate 6-digit code
        code = "".join(random.choices(string.digits, k=6))
        self._verification_codes[email] = code

        # TODO: Actually send email via SMTP or email service
        print(f"Verification code for {email}: {code}")

        return True

    async def verify_email(self, email: str, code: str) -> EmailVerificationResponse:
        """이메일 인증 확인"""
        stored_code = self._verification_codes.get(email)
        is_verified = stored_code == code

        if is_verified:
            del self._verification_codes[email]
            # TODO: Update user's email verification status in DB

        return EmailVerificationResponse(
            email=email,
            isVerified=is_verified,
            verifiedAt=datetime.utcnow() if is_verified else None,
        )

    # ============== Complete ==============

    async def complete_onboarding(self, user_id: UUID) -> OnboardingCompleteResponse:
        """온보딩 완료"""
        # Get user's shop
        result = await self.db.execute(
            select(Shop).where(Shop.owner_id == user_id).limit(1)
        )
        shop = result.scalar_one_or_none()

        # Mark onboarding as complete
        # TODO: Update user's onboarding status in DB

        return OnboardingCompleteResponse(
            userId=user_id,
            shopId=shop.id if shop else uuid4(),  # Fallback for mock
            profileCompleted=True,
            shopCreated=shop is not None,
            integrationsConnected=0,  # TODO: Count actual connections
            completedAt=datetime.utcnow(),
        )

    async def skip_onboarding(self, user_id: UUID) -> OnboardingStatus:
        """온보딩 건너뛰기"""
        return OnboardingStatus(
            userId=user_id,
            currentStep="complete",
            completedSteps=["welcome", "profile", "shop", "integrations", "complete"],
            isCompleted=True,
            startedAt=datetime.utcnow(),
            completedAt=datetime.utcnow(),
        )
