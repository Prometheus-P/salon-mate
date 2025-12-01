"""
OAuth 관련 스키마
"""

from pydantic import BaseModel, Field


class OAuthURLResponse(BaseModel):
    """OAuth 인증 URL 응답"""

    auth_url: str = Field(alias="authUrl")

    model_config = {"populate_by_name": True}


class OAuthCallbackRequest(BaseModel):
    """OAuth 콜백 요청"""

    code: str
    state: str


class OAuthProvidersResponse(BaseModel):
    """지원 프로바이더 목록 응답"""

    providers: list[str]
