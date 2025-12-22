"""
SalonMate API 서버 진입점
FastAPI 애플리케이션 설정 및 라우터 등록
"""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from api.v1 import router as api_v1_router
from config.settings import get_settings
from middleware.timing import TimingMiddleware

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """애플리케이션 수명 주기 관리"""
    # 시작 시 실행
    yield
    # 종료 시 실행


def create_app() -> FastAPI:
    """FastAPI 애플리케이션 팩토리"""
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="뷰티/살롱 사장님을 위한 AI 마케팅 자동화 플랫폼",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        lifespan=lifespan,
    )

    # 미들웨어 설정 (역순으로 실행됨)
    # 1. CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 2. GZip 압축 (1KB 이상 응답)
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    # 3. API 타이밍 측정
    app.add_middleware(TimingMiddleware)

    # API 라우터 등록
    app.include_router(api_v1_router, prefix=settings.api_v1_prefix)

    return app


app = create_app()


@app.get("/health")
async def health_check() -> dict[str, str]:
    """헬스 체크 엔드포인트"""
    return {"status": "healthy", "version": settings.app_version}
