"""
온보딩 API 엔드포인트
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_db
from models.user import User
from schemas.onboarding import (
    EmailVerificationConfirm,
    EmailVerificationRequest,
    EmailVerificationResponse,
    OnboardingCompleteResponse,
    OnboardingStatus,
    OnboardingStep,
    OnboardingStepUpdate,
)
from services.onboarding_service import OnboardingService

router = APIRouter()


def get_onboarding_service(db: AsyncSession = Depends(get_db)) -> OnboardingService:
    return OnboardingService(db)


# ============== Status ==============


@router.get("/status", response_model=OnboardingStatus)
async def get_onboarding_status(
    current_user: User = Depends(get_current_user),
    service: OnboardingService = Depends(get_onboarding_service),
):
    """온보딩 상태 조회"""
    return await service.get_status(current_user.id)


@router.post("/step", response_model=OnboardingStatus)
async def update_onboarding_step(
    data: OnboardingStepUpdate,
    current_user: User = Depends(get_current_user),
    service: OnboardingService = Depends(get_onboarding_service),
):
    """온보딩 스텝 업데이트"""
    return await service.update_step(current_user.id, data.step, data.data)


@router.post("/skip", response_model=OnboardingStatus)
async def skip_onboarding(
    current_user: User = Depends(get_current_user),
    service: OnboardingService = Depends(get_onboarding_service),
):
    """온보딩 건너뛰기"""
    return await service.skip_onboarding(current_user.id)


# ============== Email Verification ==============


@router.post("/verify-email/send")
async def send_verification_email(
    data: EmailVerificationRequest,
    service: OnboardingService = Depends(get_onboarding_service),
):
    """인증 이메일 발송"""
    success = await service.send_verification_email(data.email)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email",
        )
    return {"success": True, "message": "Verification email sent"}


@router.post("/verify-email/confirm", response_model=EmailVerificationResponse)
async def confirm_email_verification(
    data: EmailVerificationConfirm,
    service: OnboardingService = Depends(get_onboarding_service),
):
    """이메일 인증 확인"""
    result = await service.verify_email(data.email, data.code)
    if not result.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code",
        )
    return result


# ============== Complete ==============


@router.post("/complete", response_model=OnboardingCompleteResponse)
async def complete_onboarding(
    current_user: User = Depends(get_current_user),
    service: OnboardingService = Depends(get_onboarding_service),
):
    """온보딩 완료"""
    return await service.complete_onboarding(current_user.id)
