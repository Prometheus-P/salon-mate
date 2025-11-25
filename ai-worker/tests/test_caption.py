"""Tests for Instagram caption generation."""

import pytest
from unittest.mock import patch, AsyncMock

from src.tasks.caption import (
    CaptionData,
    CaptionResult,
    generate_caption,
    _parse_caption_response,
)


class TestCaptionData:
    """Tests for CaptionData model."""

    def test_valid_caption_data(self):
        """Should create CaptionData with valid inputs."""
        data = CaptionData(
            post_id="post-123",
            shop_name="뷰티헤어",
            shop_type="헤어살롱",
            location="서울 강남구",
            image_description="레이어드컷 시술 후 모습",
        )

        assert data.post_id == "post-123"
        assert data.shop_type == "헤어살롱"
        assert data.tone == "친근하고 트렌디한"  # default

    def test_with_optional_fields(self):
        """Should handle optional fields."""
        data = CaptionData(
            post_id="post-456",
            shop_name="네일아트",
            shop_type="네일샵",
            location="서울 홍대",
            image_description="봄 시즌 네일 디자인",
            service_type="젤네일",
            promotion="신규 고객 20% 할인",
        )

        assert data.service_type == "젤네일"
        assert data.promotion == "신규 고객 20% 할인"


class TestCaptionResult:
    """Tests for CaptionResult model."""

    def test_create_result(self):
        """Should create CaptionResult with caption and hashtags."""
        result = CaptionResult(
            post_id="post-123",
            caption="오늘의 헤어스타일! 레이어드컷으로 가벼운 느낌 연출",
            hashtags=["헤어살롱", "레이어드컷", "강남미용실"],
        )

        assert len(result.hashtags) == 3
        assert "헤어살롱" in result.hashtags


class TestParseCaptonResponse:
    """Tests for caption response parsing."""

    def test_parse_simple_response(self):
        """Should parse caption and hashtags from simple response."""
        response = """오늘의 시술 완성! 자연스러운 레이어드컷으로 가벼움을 더했어요

#헤어살롱 #강남미용실 #레이어드컷 #오늘의헤어"""

        caption, hashtags = _parse_caption_response(response)

        assert "레이어드컷" in caption
        assert "헤어살롱" in hashtags
        assert len(hashtags) >= 3

    def test_parse_mixed_response(self):
        """Should handle hashtags mixed with caption text."""
        response = """봄 시즌 네일 디자인 #네일아트
예쁜 꽃 패턴으로 봄맞이! #봄네일 #젤네일"""

        caption, hashtags = _parse_caption_response(response)

        assert len(hashtags) >= 2
        assert "네일아트" in hashtags

    def test_limit_hashtags_to_30(self):
        """Should limit hashtags to 30 (Instagram limit)."""
        # Generate more than 30 hashtags
        many_hashtags = " ".join([f"#tag{i}" for i in range(40)])
        response = f"Test caption\n{many_hashtags}"

        caption, hashtags = _parse_caption_response(response)

        assert len(hashtags) <= 30


class TestGenerateCaption:
    """Tests for caption generation."""

    @pytest.mark.asyncio
    @patch("src.tasks.caption.ChatOpenAI")
    async def test_should_generate_caption(self, mock_llm_class):
        """Should generate caption with hashtags."""
        # Arrange
        mock_response = """오늘의 시술 완성! 자연스러운 레이어드컷

#헤어살롱 #강남미용실 #레이어드컷"""

        mock_chain = AsyncMock()
        mock_chain.ainvoke.return_value = mock_response

        data = CaptionData(
            post_id="post-123",
            shop_name="뷰티헤어",
            shop_type="헤어살롱",
            location="서울 강남구",
            image_description="레이어드컷 시술 후 모습",
        )

        # Act
        with patch("src.tasks.caption.ChatPromptTemplate") as mock_prompt:
            mock_prompt.from_messages.return_value.__or__ = lambda self, other: mock_chain
            mock_llm_class.return_value.__or__ = lambda self, other: mock_chain
            result = await generate_caption(data)

        # Assert
        assert result.post_id == "post-123"


class TestCaptionQuality:
    """Tests for caption content quality."""

    def test_caption_should_not_be_empty(self):
        """Caption should have content."""
        result = CaptionResult(
            post_id="test",
            caption="오늘의 시술",
            hashtags=["헤어"],
        )

        assert len(result.caption) > 0

    def test_hashtags_should_not_include_hash_symbol(self):
        """Parsed hashtags should not include # symbol."""
        response = "#헤어살롱 #네일아트"
        _, hashtags = _parse_caption_response(response)

        for tag in hashtags:
            assert not tag.startswith("#")

    def test_should_handle_korean_hashtags(self):
        """Should correctly parse Korean hashtags."""
        response = "테스트\n#헤어살롱 #강남미용실 #오늘의헤어"
        _, hashtags = _parse_caption_response(response)

        assert "헤어살롱" in hashtags
        assert "강남미용실" in hashtags
