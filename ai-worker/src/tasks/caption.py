"""Instagram caption generation task using LangChain."""

from typing import Any

import structlog
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from pydantic import BaseModel

from src.config import settings
from src.prompts.caption import CAPTION_SYSTEM_PROMPT, CAPTION_USER_PROMPT

logger = structlog.get_logger(__name__)


class CaptionData(BaseModel):
    """Input data for caption generation."""

    post_id: str
    shop_name: str
    shop_type: str
    location: str
    image_description: str
    service_type: str = ""
    promotion: str = ""
    tone: str = "친근하고 트렌디한"


class CaptionResult(BaseModel):
    """Result of caption generation."""

    post_id: str
    caption: str
    hashtags: list[str]


async def generate_caption(data: CaptionData) -> CaptionResult:
    """
    Generate an Instagram caption with hashtags.

    Args:
        data: Post data including image description and shop info

    Returns:
        Generated caption and hashtags
    """
    logger.info("Generating caption", post_id=data.post_id, shop_type=data.shop_type)

    # Create the LLM
    llm = ChatOpenAI(
        model=settings.openai_model,
        temperature=0.8,
        api_key=settings.openai_api_key,
    )

    # Create the prompt for caption
    caption_prompt = ChatPromptTemplate.from_messages([
        ("system", CAPTION_SYSTEM_PROMPT),
        ("user", CAPTION_USER_PROMPT),
    ])

    # Create the chain
    chain = caption_prompt | llm | StrOutputParser()

    # Generate caption
    response = await chain.ainvoke({
        "shop_name": data.shop_name,
        "shop_type": data.shop_type,
        "location": data.location,
        "image_description": data.image_description,
        "service_type": data.service_type,
        "promotion": data.promotion,
        "tone": data.tone,
    })

    # Parse caption and hashtags
    caption, hashtags = _parse_caption_response(response)

    logger.info(
        "Caption generated",
        post_id=data.post_id,
        caption_length=len(caption),
        hashtag_count=len(hashtags),
    )

    return CaptionResult(
        post_id=data.post_id,
        caption=caption,
        hashtags=hashtags,
    )


def _parse_caption_response(response: str) -> tuple[str, list[str]]:
    """Parse the LLM response to extract caption and hashtags."""
    lines = response.strip().split("\n")
    caption_lines: list[str] = []
    hashtags: list[str] = []

    for line in lines:
        # Check if line contains hashtags
        if "#" in line:
            # Extract hashtags from this line
            words = line.split()
            for word in words:
                if word.startswith("#"):
                    hashtag = word.strip("#,. ")
                    if hashtag:
                        hashtags.append(hashtag)
                else:
                    caption_lines.append(word)
        else:
            caption_lines.append(line)

    caption = " ".join(caption_lines).strip()

    # Limit to 30 hashtags (Instagram limit)
    hashtags = hashtags[:30]

    return caption, hashtags


def process_caption_task(task_data: dict[str, Any]) -> dict[str, Any]:
    """
    Process a caption generation task from the queue.

    This is the entry point called by the worker.
    """
    import asyncio

    data = CaptionData(**task_data)
    result = asyncio.run(generate_caption(data))

    return result.model_dump()
