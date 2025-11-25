"""Review response generation task using LangChain."""

from typing import Any

import structlog
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from pydantic import BaseModel

from src.config import settings
from src.prompts.review import REVIEW_RESPONSE_SYSTEM_PROMPT, REVIEW_RESPONSE_USER_PROMPT

logger = structlog.get_logger(__name__)


class ReviewData(BaseModel):
    """Input data for review response generation."""

    review_id: str
    shop_name: str
    shop_type: str
    reviewer_name: str
    rating: int
    content: str
    tone: str = "친근하고 전문적인"


class ReviewResponseResult(BaseModel):
    """Result of review response generation."""

    review_id: str
    response: str
    is_positive: bool


async def generate_review_response(data: ReviewData) -> ReviewResponseResult:
    """
    Generate an AI response for a customer review.

    Args:
        data: Review data including content, rating, and shop info

    Returns:
        Generated response with metadata
    """
    logger.info("Generating review response", review_id=data.review_id, rating=data.rating)

    # Determine sentiment
    is_positive = data.rating >= 4

    # Create the LLM
    llm = ChatOpenAI(
        model=settings.openai_model,
        temperature=0.7,
        api_key=settings.openai_api_key,
    )

    # Create the prompt
    prompt = ChatPromptTemplate.from_messages([
        ("system", REVIEW_RESPONSE_SYSTEM_PROMPT),
        ("user", REVIEW_RESPONSE_USER_PROMPT),
    ])

    # Create the chain
    chain = prompt | llm | StrOutputParser()

    # Generate response
    response = await chain.ainvoke({
        "shop_name": data.shop_name,
        "shop_type": data.shop_type,
        "reviewer_name": data.reviewer_name,
        "rating": data.rating,
        "review_content": data.content,
        "tone": data.tone,
        "sentiment": "긍정적" if is_positive else "부정적",
    })

    logger.info(
        "Review response generated",
        review_id=data.review_id,
        response_length=len(response),
    )

    return ReviewResponseResult(
        review_id=data.review_id,
        response=response.strip(),
        is_positive=is_positive,
    )


def process_review_response_task(task_data: dict[str, Any]) -> dict[str, Any]:
    """
    Process a review response task from the queue.

    This is the entry point called by the worker.
    """
    import asyncio

    data = ReviewData(**task_data)
    result = asyncio.run(generate_review_response(data))

    return result.model_dump()
