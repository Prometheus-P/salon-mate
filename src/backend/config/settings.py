"""
애플리케이션 설정 관리
환경 변수를 통해 설정을 로드합니다.
"""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """애플리케이션 설정"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # 앱 설정
    app_name: str = "SalonMate API"
    app_version: str = "0.1.0"
    debug: bool = False
    environment: Literal["development", "staging", "production"] = "development"

    # API 설정
    api_v1_prefix: str = "/v1"

    # 보안 설정
    secret_key: str = "your-secret-key-change-in-production"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    algorithm: str = "HS256"

    # 데이터베이스 설정
    database_url: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/salonmate"
    )

    # Redis 설정
    redis_url: str = "redis://localhost:6379/0"

    # CORS 설정
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://app.salonmate.kr",
    ]

    # OpenAI 설정
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"
    openai_fallback_model: str = "gpt-4o-mini"

    # 외부 API 설정
    google_client_id: str = ""
    google_client_secret: str = ""
    kakao_client_id: str = ""
    kakao_client_secret: str = ""
    instagram_app_id: str = ""
    instagram_app_secret: str = ""

    # OAuth Redirect URIs
    oauth_redirect_base_url: str = "http://localhost:3000/auth/callback"

    # Rate Limiting
    rate_limit_default: int = 100
    rate_limit_auth: int = 10
    rate_limit_ai: int = 20

    # Sentry 설정
    sentry_dsn: str = ""
    sentry_traces_sample_rate: float = 1.0
    sentry_profiles_sample_rate: float = 1.0


@lru_cache
def get_settings() -> Settings:
    """캐시된 설정 인스턴스를 반환합니다."""
    return Settings()
