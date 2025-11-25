"""
SalonMate AI Worker Configuration
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Environment
    app_env: str = "development"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Database
    database_url: str = "postgresql://postgres:password@localhost:5432/salonmate"

    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"
    openai_fallback_model: str = "gpt-4o-mini"

    # AI Configuration
    max_response_length: int = 500
    max_caption_length: int = 2200
    max_hashtags: int = 30

    # Worker Configuration
    worker_concurrency: int = 5
    task_timeout: int = 60
    retry_attempts: int = 3

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
