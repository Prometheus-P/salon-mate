"""
인증 서비스
회원가입, 로그인, 토큰 관리 비즈니스 로직
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import create_tokens, hash_password, verify_password, decode_token
from models.user import User
from schemas.auth import (
    AuthResponse,
    UserCreate,
    UserLogin,
    UserResponse,
    AccessTokenResponse,
)


class AuthException(Exception):
    """인증 관련 예외"""

    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class AuthService:
    """인증 서비스"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def signup(self, user_data: UserCreate) -> AuthResponse:
        """새 사용자를 등록하고 토큰을 발급합니다."""
        # 이메일 중복 확인
        existing_user = await self._get_user_by_email(user_data.email)
        if existing_user:
            raise AuthException(
                "이미 존재하는 이메일입니다.",
                status_code=409,
            )

        # 비밀번호 해싱
        password_hash = hash_password(user_data.password)

        # 사용자 생성
        user = User(
            email=user_data.email,
            password_hash=password_hash,
            name=user_data.name,
            auth_provider="email",
        )

        try:
            self.db.add(user)
            await self.db.commit()
            await self.db.refresh(user)
        except IntegrityError as e:
            await self.db.rollback()
            raise AuthException(
                "이미 존재하는 이메일입니다.",
                status_code=409,
            ) from e

        # 토큰 생성
        access_token, refresh_token, expires_in = create_tokens(str(user.id))

        return AuthResponse(
            user=UserResponse(
                id=user.id,
                email=user.email,
                name=user.name,
                createdAt=user.created_at,
            ),
            accessToken=access_token,
            refreshToken=refresh_token,
            expiresIn=expires_in,
        )

    async def login(self, credentials: UserLogin) -> AuthResponse:
        """이메일과 비밀번호로 로그인합니다."""
        # 사용자 조회
        user = await self._get_user_by_email(credentials.email)
        if not user:
            raise AuthException(
                "이메일 또는 비밀번호가 올바르지 않습니다.",
                status_code=401,
            )

        # 비밀번호 검증
        if not user.password_hash or not verify_password(
            credentials.password, user.password_hash
        ):
            raise AuthException(
                "이메일 또는 비밀번호가 올바르지 않습니다.",
                status_code=401,
            )

        # 토큰 생성
        access_token, refresh_token, expires_in = create_tokens(str(user.id))

        return AuthResponse(
            user=UserResponse(
                id=user.id,
                email=user.email,
                name=user.name,
                createdAt=user.created_at,
            ),
            accessToken=access_token,
            refreshToken=refresh_token,
            expiresIn=expires_in,
        )

    async def refresh_token(self, refresh_token: str) -> AccessTokenResponse:
        """리프레시 토큰으로 새 액세스 토큰을 발급합니다."""
        # 토큰 디코딩
        payload = decode_token(refresh_token)
        if not payload:
            raise AuthException(
                "유효하지 않은 리프레시 토큰입니다.",
                status_code=401,
            )

        # 토큰 타입 확인
        if payload.get("type") != "refresh":
            raise AuthException(
                "유효하지 않은 리프레시 토큰입니다.",
                status_code=401,
            )

        # 사용자 ID 추출
        user_id = payload.get("sub")
        if not user_id:
            raise AuthException(
                "유효하지 않은 리프레시 토큰입니다.",
                status_code=401,
            )

        # 사용자 존재 확인
        user = await self._get_user_by_id(UUID(user_id))
        if not user:
            raise AuthException(
                "사용자를 찾을 수 없습니다.",
                status_code=401,
            )

        # 새 액세스 토큰 생성
        from core.security import create_access_token
        from config.settings import get_settings

        settings = get_settings()
        access_token = create_access_token({"sub": str(user.id)})
        expires_in = settings.access_token_expire_minutes * 60

        return AccessTokenResponse(
            accessToken=access_token,
            expiresIn=expires_in,
        )

    async def get_current_user(self, token: str) -> User:
        """토큰에서 현재 사용자를 가져옵니다."""
        payload = decode_token(token)
        if not payload:
            raise AuthException(
                "유효하지 않은 토큰입니다.",
                status_code=401,
            )

        if payload.get("type") != "access":
            raise AuthException(
                "유효하지 않은 액세스 토큰입니다.",
                status_code=401,
            )

        user_id = payload.get("sub")
        if not user_id:
            raise AuthException(
                "유효하지 않은 토큰입니다.",
                status_code=401,
            )

        user = await self._get_user_by_id(UUID(user_id))
        if not user:
            raise AuthException(
                "사용자를 찾을 수 없습니다.",
                status_code=401,
            )

        return user

    async def _get_user_by_email(self, email: str) -> User | None:
        """이메일로 사용자를 조회합니다."""
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def _get_user_by_id(self, user_id: UUID) -> User | None:
        """ID로 사용자를 조회합니다."""
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()
