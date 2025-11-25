"""
SalonMate AI Worker
리뷰 답변 생성, 캡션 생성, 해시태그 추천 등 AI 작업 처리
"""

import asyncio
import os
import signal
import structlog

from src.config import settings

# 로거 설정
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
)

logger = structlog.get_logger()


async def process_tasks():
    """Redis 큐에서 태스크를 가져와 처리"""
    logger.info("Starting AI Worker", redis_url=settings.REDIS_URL)

    # TODO: Redis 연결 및 태스크 처리 루프 구현
    # - review_response: 리뷰 답변 생성
    # - caption_generation: 인스타그램 캡션 생성
    # - hashtag_recommendation: 해시태그 추천

    while True:
        try:
            # Placeholder: 태스크 폴링
            await asyncio.sleep(1)
        except asyncio.CancelledError:
            logger.info("Worker shutdown requested")
            break
        except Exception as e:
            logger.error("Error processing task", error=str(e))
            await asyncio.sleep(5)


def main():
    """Worker 진입점"""
    logger.info(
        "SalonMate AI Worker starting",
        env=settings.APP_ENV,
        openai_configured=bool(settings.OPENAI_API_KEY),
    )

    # 시그널 핸들러 설정
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    def shutdown_handler(sig):
        logger.info("Received shutdown signal", signal=sig)
        for task in asyncio.all_tasks(loop):
            task.cancel()

    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, lambda s=sig: shutdown_handler(s))

    try:
        loop.run_until_complete(process_tasks())
    except KeyboardInterrupt:
        logger.info("Worker interrupted")
    finally:
        loop.close()
        logger.info("Worker stopped")


if __name__ == "__main__":
    main()
