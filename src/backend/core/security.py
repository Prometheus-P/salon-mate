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
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _truncate_password(password: str, max_bytes: int = 72) -> bytes:
    """비밀번호를 bcrypt 최대 바이트 제한에 맞게 잘라냅니다.

    bcrypt는 72바이트 제한이 있습니다. UTF-8 문자열을 바이트로 인코딩한 후
    최대 길이 이내에서 유효한 UTF-8 시퀀스를 유지하면서 자릅니다.
    """
    password_bytes = password.encode("utf-8")
    if len(password_bytes) <= max_bytes:
        return password_bytes
    # 72바이트에서 잘라도 UTF-8 멀티바이트 문자가 깨지지 않도록 처리
    truncated = password_bytes[:max_bytes]
    # 깨진 UTF-8 시퀀스 제거 (마지막 불완전한 문자 제거)
    while truncated and truncated[-1] & 0xC0 == 0x80:
        truncated = truncated[:-1]
    if truncated and truncated[-1] & 0x80:
        # 멀티바이트 시작 바이트 확인 및 제거
        if truncated[-1] & 0xE0 == 0xC0:  # 2바이트 시작
            truncated = truncated[:-1]
        elif truncated[-1] & 0xF0 == 0xE0:  # 3바이트 시작
            truncated = truncated[:-1]
        elif truncated[-1] & 0xF8 == 0xF0:  # 4바이트 시작
            truncated = truncated[:-1]
    return truncated


def hash_password(password: str) -> str:
    """비밀번호를 bcrypt로 해싱합니다.

    bcrypt는 최대 72바이트까지만 지원하므로 필요시 자동으로 잘라냅니다.
    """
    truncated = _truncate_password(password)
    return pwd_context.hash(truncated.decode("utf-8"))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """평문 비밀번호와 해시된 비밀번호를 비교합니다."""
    truncated = _truncate_password(plain_password)
    return pwd_context.verify(truncated.decode("utf-8"), hashed_password)


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
