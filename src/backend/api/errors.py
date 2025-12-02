"""
API 에러 핸들러
"""

from datetime import UTC, datetime
from uuid import uuid4

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse


class AppException(HTTPException):
    """애플리케이션 커스텀 예외"""

    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: dict | None = None,
    ) -> None:
        self.code = code
        self.message = message
        self.details = details
        super().__init__(status_code=status_code, detail=message)


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """AppException 핸들러"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
            "meta": {
                "requestId": str(uuid4()),
                "timestamp": datetime.now(UTC).isoformat(),
            },
        },
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """HTTPException 핸들러"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": "HTTP_ERROR",
                "message": str(exc.detail),
                "details": None,
            },
            "meta": {
                "requestId": str(uuid4()),
                "timestamp": datetime.now(UTC).isoformat(),
            },
        },
    )
