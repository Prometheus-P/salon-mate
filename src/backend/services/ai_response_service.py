"""
AI 리뷰 답변 생성 서비스
OpenAI API 연동 전 Mock 버전
"""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from config.settings import get_settings
from models.review import Review
from models.shop import Shop
from models.user import User
from services.review_service import ReviewService

settings = get_settings()


class AIResponseException(Exception):
    """AI 응답 관련 예외"""

    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class AIResponseService:
    """AI 리뷰 답변 생성 서비스 (Mock)"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.review_service = ReviewService(db)

    async def generate_response(
        self,
        user: User,
        shop_id: UUID,
        review_id: UUID,
        tone: str = "friendly",
        include_shop_name: bool = False,
        max_length: int = 500,
    ) -> tuple[str, datetime]:
        """리뷰에 대한 AI 답변을 생성합니다.

        Returns:
            tuple: (생성된 답변, 생성 시간)
        """
        review = await self.review_service.get_review_by_id(user, shop_id, review_id)
        if not review:
            raise AIResponseException("리뷰를 찾을 수 없습니다.", status_code=404)

        # 매장 정보 조회
        shop = await self._get_shop(shop_id)

        # Mock 답변 생성
        ai_response = self._generate_mock_response(
            review=review,
            shop=shop,
            tone=tone,
            include_shop_name=include_shop_name,
        )

        # 리뷰에 AI 답변 저장
        generated_at = datetime.now(timezone.utc)
        review.ai_response = ai_response
        review.ai_response_generated_at = generated_at
        await self.db.commit()

        return ai_response, generated_at

    async def _get_shop(self, shop_id: UUID) -> Shop | None:
        """매장 정보를 조회합니다."""
        from sqlalchemy import select
        result = await self.db.execute(select(Shop).where(Shop.id == shop_id))
        return result.scalar_one_or_none()

    def _generate_mock_response(
        self,
        review: Review,
        shop: Shop | None,
        tone: str,
        include_shop_name: bool,
    ) -> str:
        """Mock 답변을 생성합니다.

        실제 OpenAI API 연동 전까지 사용할 Mock 답변입니다.
        """
        shop_name = shop.name if shop and include_shop_name else "저희 매장"
        shop_type = self._get_shop_type_korean(shop.type if shop else "nail")

        # 평점에 따른 답변 템플릿
        if review.rating >= 4:
            return self._generate_positive_response(
                reviewer_name=review.reviewer_name,
                shop_name=shop_name,
                shop_type=shop_type,
                content=review.content,
                tone=tone,
            )
        elif review.rating >= 3:
            return self._generate_neutral_response(
                reviewer_name=review.reviewer_name,
                shop_name=shop_name,
                shop_type=shop_type,
                content=review.content,
                tone=tone,
            )
        else:
            return self._generate_negative_response(
                reviewer_name=review.reviewer_name,
                shop_name=shop_name,
                shop_type=shop_type,
                content=review.content,
                tone=tone,
            )

    def _get_shop_type_korean(self, shop_type: str) -> str:
        """매장 유형을 한글로 변환합니다."""
        type_map = {
            "nail": "네일",
            "hair": "헤어",
            "skin": "피부 관리",
            "lash": "속눈썹",
        }
        return type_map.get(shop_type, "뷰티")

    def _generate_positive_response(
        self,
        reviewer_name: str,
        shop_name: str,
        shop_type: str,
        content: str | None,
        tone: str,
    ) -> str:
        """긍정 리뷰에 대한 답변을 생성합니다."""
        if tone == "formal":
            return (
                f"{reviewer_name} 고객님, 안녕하세요.\n\n"
                f"{shop_name}을 이용해 주시고 좋은 리뷰를 남겨 주셔서 진심으로 감사드립니다. "
                f"고객님의 소중한 후기가 저희에게 큰 힘이 됩니다.\n\n"
                f"앞으로도 최상의 {shop_type} 서비스로 보답하겠습니다. "
                f"다음 방문 시에도 만족스러운 경험을 드릴 수 있도록 최선을 다하겠습니다.\n\n"
                f"감사합니다."
            )
        elif tone == "casual":
            return (
                f"{reviewer_name}님, 리뷰 감사해요! 🙏\n\n"
                f"좋게 봐주셔서 정말 기쁘네요~ "
                f"다음에 또 오시면 더 예쁘게 해드릴게요! ✨\n\n"
                f"또 뵙겠습니다! 💕"
            )
        else:  # friendly (default)
            return (
                f"{reviewer_name}님, 안녕하세요!\n\n"
                f"{shop_name}에 방문해 주시고 좋은 리뷰까지 남겨 주셔서 정말 감사합니다. "
                f"고객님께서 만족하셨다니 저희도 너무 기쁩니다!\n\n"
                f"앞으로도 더 좋은 {shop_type} 서비스로 보답하겠습니다. "
                f"다음에 또 뵙겠습니다! 감사합니다. 😊"
            )

    def _generate_neutral_response(
        self,
        reviewer_name: str,
        shop_name: str,
        shop_type: str,
        content: str | None,
        tone: str,
    ) -> str:
        """중립 리뷰에 대한 답변을 생성합니다."""
        return (
            f"{reviewer_name}님, 안녕하세요.\n\n"
            f"{shop_name}을 이용해 주셔서 감사합니다. "
            f"소중한 피드백을 주셔서 감사드립니다.\n\n"
            f"고객님의 의견을 반영하여 더 나은 서비스를 제공할 수 있도록 노력하겠습니다. "
            f"다음 방문 시에는 더욱 만족스러운 경험을 드릴 수 있도록 최선을 다하겠습니다.\n\n"
            f"감사합니다."
        )

    def _generate_negative_response(
        self,
        reviewer_name: str,
        shop_name: str,
        shop_type: str,
        content: str | None,
        tone: str,
    ) -> str:
        """부정 리뷰에 대한 답변을 생성합니다."""
        return (
            f"{reviewer_name}님, 안녕하세요.\n\n"
            f"먼저 {shop_name}을 이용해 주셔서 감사드리며, "
            f"불편을 드려 진심으로 죄송합니다.\n\n"
            f"고객님께서 말씀해 주신 부분에 대해 깊이 반성하고, "
            f"즉시 개선할 수 있도록 노력하겠습니다. "
            f"다음에 다시 방문해 주신다면 더 나은 서비스로 보답하겠습니다.\n\n"
            f"다시 한번 불편을 드린 점 사과드립니다. 감사합니다."
        )
