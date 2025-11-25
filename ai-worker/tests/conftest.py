"""Pytest configuration and fixtures for AI Worker tests."""

import os
import pytest


@pytest.fixture(autouse=True)
def setup_test_env():
    """Set up test environment variables."""
    os.environ["APP_ENV"] = "test"
    os.environ["OPENAI_API_KEY"] = "test-api-key"
    os.environ["REDIS_URL"] = "redis://localhost:6379/1"
    yield
    # Cleanup if needed


@pytest.fixture
def sample_review_data():
    """Sample review data for testing."""
    return {
        "review_id": "test-review-123",
        "shop_name": "뷰티헤어 강남점",
        "shop_type": "헤어살롱",
        "reviewer_name": "홍길동",
        "rating": 5,
        "content": "시술이 정말 좋았어요. 원장님이 친절하시고 스타일링도 마음에 들어요.",
    }


@pytest.fixture
def sample_caption_data():
    """Sample caption data for testing."""
    return {
        "post_id": "test-post-456",
        "shop_name": "뷰티헤어 강남점",
        "shop_type": "헤어살롱",
        "location": "서울 강남구 역삼동",
        "image_description": "레이어드컷과 애쉬브라운 염색을 한 여성 고객의 뒷모습",
        "service_type": "컷 + 염색",
        "promotion": "",
    }


@pytest.fixture
def negative_review_data():
    """Sample negative review data for testing."""
    return {
        "review_id": "test-review-789",
        "shop_name": "뷰티헤어 강남점",
        "shop_type": "헤어살롱",
        "reviewer_name": "김철수",
        "rating": 2,
        "content": "대기 시간이 너무 길었고, 원하는 스타일이 나오지 않았어요.",
    }
