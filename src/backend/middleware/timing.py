"""
API 응답 시간 측정 미들웨어
"""

import logging
import time
from collections.abc import Awaitable, Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

RequestResponseEndpoint = Callable[[Request], Awaitable[Response]]

logger = logging.getLogger(__name__)


class TimingMiddleware(BaseHTTPMiddleware):
    """API 응답 시간을 측정하고 로깅하는 미들웨어."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start_time = time.perf_counter()

        response = await call_next(request)

        process_time = time.perf_counter() - start_time
        process_time_ms = process_time * 1000

        # Add timing header
        response.headers["X-Process-Time-Ms"] = f"{process_time_ms:.2f}"

        # Log slow requests (>500ms)
        if process_time_ms > 500:
            logger.warning(
                "Slow API response: %s %s took %.2fms",
                request.method,
                request.url.path,
                process_time_ms,
            )
        else:
            logger.debug(
                "API response: %s %s took %.2fms",
                request.method,
                request.url.path,
                process_time_ms,
            )

        return response
