"""
보안 관련 유틸리티
비밀번호 해싱, JWT 토큰 생성/검증
"""

from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from config.settings import get_settings

settings = get_settings()

# 비밀번호 해싱 컨텍스트
# truncate_error=False를 설정하여 bcrypt가 72바이트를 초과하는 비밀번호를 자동으로 자르도록 함
pwd_context = CryptContext(
    schemes=["bcrypt"], deprecated="auto", bcrypt__truncate_error=False
)


def hash_password(password: str) -> str:
    """비밀번호를 bcrypt로 해싱합니다.

    bcrypt는 최대 72바이트까지만 지원하므로 passlib이 자동으로 잘라냅니다.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """평문 비밀번호와 해시된 비밀번호를 비교합니다."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    data: dict[str, Any],
    expires_delta: timedelta | None = None,
) -> str:
    """액세스 토큰을 생성합니다."""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(
            minutes=settings.access_token_expire_minutes
        )

    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(
        to_encode, settings.secret_key, algorithm=settings.algorithm
    )
    return encoded_jwt


def create_refresh_token(
    data: dict[str, Any],
    expires_delta: timedelta | None = None,
) -> str:
    """리프레시 토큰을 생성합니다."""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)

    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(
        to_encode, settings.secret_key, algorithm=settings.algorithm
    )
    return encoded_jwt


def decode_token(token: str) -> dict[str, Any] | None:
    """토큰을 디코딩하고 검증합니다."""
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        return payload
    except JWTError:
        return None


def create_tokens(user_id: str) -> tuple[str, str, int]:
    """액세스 토큰과 리프레시 토큰을 생성합니다.

    Returns:
        tuple: (access_token, refresh_token, expires_in_seconds)
    """
    token_data = {"sub": user_id}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    expires_in = settings.access_token_expire_minutes * 60

    return access_token, refresh_token, expires_in
