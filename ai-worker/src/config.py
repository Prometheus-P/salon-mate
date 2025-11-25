"""
SalonMate AI Worker 설정
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """애플리케이션 설정"""

    # 환경
    APP_ENV: str = "development"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/salonmate"

    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_FALLBACK_MODEL: str = "gpt-4o-mini"

    # AI 설정
    MAX_RESPONSE_LENGTH: int = 500
    MAX_CAPTION_LENGTH: int = 2200
    MAX_HASHTAGS: int = 30

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
