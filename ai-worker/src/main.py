"""
SalonMate AI Worker
Handles AI tasks: review response generation, caption generation, hashtag recommendation
"""

import asyncio
import json
import signal
from typing import Any

import redis.asyncio as redis
import structlog

from src.config import settings
from src.tasks.review_response import process_review_response_task
from src.tasks.caption import process_caption_task

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer()
        if settings.app_env == "production"
        else structlog.dev.ConsoleRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
)

logger = structlog.get_logger()

# Task type to handler mapping
TASK_HANDLERS: dict[str, Any] = {
    "review_response": process_review_response_task,
    "caption_generation": process_caption_task,
}

# Queue names
QUEUE_NAME = "salonmate:ai:tasks"
RESULT_QUEUE_PREFIX = "salonmate:ai:results:"


async def process_task(task_type: str, task_data: dict[str, Any]) -> dict[str, Any]:
    """Process a single task based on its type."""
    handler = TASK_HANDLERS.get(task_type)
    if not handler:
        raise ValueError(f"Unknown task type: {task_type}")

    return handler(task_data)


async def worker_loop(client: redis.Redis) -> None:
    """Main worker loop - poll Redis for tasks and process them."""
    logger.info("Worker loop started", queue=QUEUE_NAME)

    while True:
        try:
            # Blocking pop from queue with 5 second timeout
            result = await client.blpop(QUEUE_NAME, timeout=5)

            if result is None:
                continue

            _, task_json = result
            task = json.loads(task_json)

            task_id = task.get("id", "unknown")
            task_type = task.get("type")
            task_data = task.get("data", {})

            logger.info("Processing task", task_id=task_id, task_type=task_type)

            try:
                # Process the task
                result_data = await process_task(task_type, task_data)

                # Store result
                result_key = f"{RESULT_QUEUE_PREFIX}{task_id}"
                await client.setex(
                    result_key,
                    3600,  # 1 hour TTL
                    json.dumps({"status": "completed", "result": result_data}),
                )

                logger.info("Task completed", task_id=task_id)

            except Exception as e:
                logger.error("Task failed", task_id=task_id, error=str(e))

                # Store error result
                result_key = f"{RESULT_QUEUE_PREFIX}{task_id}"
                await client.setex(
                    result_key,
                    3600,
                    json.dumps({"status": "failed", "error": str(e)}),
                )

        except asyncio.CancelledError:
            logger.info("Worker shutdown requested")
            break
        except Exception as e:
            logger.error("Error in worker loop", error=str(e))
            await asyncio.sleep(5)


async def run_worker() -> None:
    """Initialize and run the worker."""
    logger.info(
        "Connecting to Redis",
        redis_url=settings.redis_url.replace(settings.redis_url.split("@")[-1], "***")
        if "@" in settings.redis_url
        else settings.redis_url,
    )

    client = redis.from_url(settings.redis_url, decode_responses=True)

    try:
        # Test connection
        await client.ping()
        logger.info("Connected to Redis")

        # Run worker loop
        await worker_loop(client)

    finally:
        await client.close()
        logger.info("Redis connection closed")


def main() -> None:
    """Worker entry point."""
    logger.info(
        "SalonMate AI Worker starting",
        env=settings.app_env,
        openai_configured=bool(settings.openai_api_key),
    )

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    # Shutdown handler
    shutdown_event = asyncio.Event()

    def shutdown_handler(sig: signal.Signals) -> None:
        logger.info("Received shutdown signal", signal=sig.name)
        shutdown_event.set()
        for task in asyncio.all_tasks(loop):
            task.cancel()

    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, lambda s=sig: shutdown_handler(s))

    try:
        loop.run_until_complete(run_worker())
    except KeyboardInterrupt:
        logger.info("Worker interrupted")
    finally:
        loop.close()
        logger.info("Worker stopped")


if __name__ == "__main__":
    main()
