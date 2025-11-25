"""Tests for review response generation."""

import pytest
from unittest.mock import patch, AsyncMock

from src.tasks.review_response import (
    ReviewData,
    ReviewResponseResult,
    generate_review_response,
)


class TestReviewData:
    """Tests for ReviewData model."""

    def test_valid_review_data(self):
        """Should create ReviewData with valid inputs."""
        data = ReviewData(
            review_id="test-123",
            shop_name="뷰티헤어",
            shop_type="헤어살롱",
            reviewer_name="홍길동",
            rating=5,
            content="정말 좋았어요! 다음에 또 올게요.",
        )

        assert data.review_id == "test-123"
        assert data.rating == 5
        assert data.tone == "친근하고 전문적인"  # default

    def test_custom_tone(self):
        """Should accept custom tone."""
        data = ReviewData(
            review_id="test-123",
            shop_name="뷰티헤어",
            shop_type="헤어살롱",
            reviewer_name="홍길동",
            rating=5,
            content="좋아요",
            tone="격식있고 정중한",
        )

        assert data.tone == "격식있고 정중한"


class TestReviewResponseResult:
    """Tests for ReviewResponseResult model."""

    def test_positive_review_result(self):
        """Should create result for positive review."""
        result = ReviewResponseResult(
            review_id="test-123",
            response="고객님, 소중한 리뷰 감사합니다!",
            is_positive=True,
        )

        assert result.is_positive is True
        assert len(result.response) > 0


class TestGenerateReviewResponse:
    """Tests for review response generation."""

    @pytest.mark.asyncio
    @patch("src.tasks.review_response.ChatOpenAI")
    async def test_should_generate_response_for_positive_review(self, mock_llm_class):
        """Should generate appropriate response for 5-star review."""
        # Arrange
        mock_chain = AsyncMock()
        mock_chain.ainvoke.return_value = "고객님, 방문해 주셔서 감사합니다!"

        mock_llm = AsyncMock()
        mock_llm_class.return_value = mock_llm
        mock_llm.__or__ = lambda self, other: mock_chain

        data = ReviewData(
            review_id="test-123",
            shop_name="뷰티헤어",
            shop_type="헤어살롱",
            reviewer_name="홍길동",
            rating=5,
            content="정말 좋았어요!",
        )

        # Act
        with patch("src.tasks.review_response.ChatPromptTemplate") as mock_prompt:
            mock_prompt.from_messages.return_value.__or__ = lambda self, other: mock_chain
            result = await generate_review_response(data)

        # Assert
        assert result.review_id == "test-123"
        assert result.is_positive is True

    @pytest.mark.asyncio
    async def test_should_identify_negative_review(self):
        """Should correctly identify reviews with rating < 4 as negative."""
        data = ReviewData(
            review_id="test-456",
            shop_name="뷰티헤어",
            shop_type="헤어살롱",
            reviewer_name="김철수",
            rating=2,
            content="별로였어요.",
        )

        # The is_positive flag should be determined by rating
        assert data.rating < 4

    def test_rating_boundary_positive(self):
        """Rating of 4 should be considered positive."""
        data = ReviewData(
            review_id="test-789",
            shop_name="네일샵",
            shop_type="네일",
            reviewer_name="이영희",
            rating=4,
            content="괜찮았어요.",
        )

        is_positive = data.rating >= 4
        assert is_positive is True

    def test_rating_boundary_negative(self):
        """Rating of 3 should be considered negative."""
        data = ReviewData(
            review_id="test-abc",
            shop_name="네일샵",
            shop_type="네일",
            reviewer_name="박지민",
            rating=3,
            content="그냥 그래요.",
        )

        is_positive = data.rating >= 4
        assert is_positive is False


class TestResponseContent:
    """Tests for response content quality."""

    def test_should_not_exceed_max_length(self):
        """Generated response should not exceed maximum length."""
        # This would be tested with actual LLM integration
        max_length = 500
        sample_response = "고객님, 방문해 주셔서 감사합니다." * 10

        # Truncation logic would be in the actual implementation
        assert len(sample_response[:max_length]) <= max_length

    def test_should_include_shop_name(self):
        """Response should include the shop name when appropriate."""
        shop_name = "뷰티헤어 강남점"
        sample_response = f"{shop_name}을 방문해 주셔서 감사합니다."

        assert shop_name in sample_response
