"""
Vision AI 서비스
OpenAI Vision API를 사용한 뷰티 시술 이미지 분석
"""

import json
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config.settings import get_settings
from models.style_tag import StyleTag

settings = get_settings()


class VisionServiceError(Exception):
    """Vision 서비스 예외"""

    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


# 뷰티 시술 분석을 위한 시스템 프롬프트
BEAUTY_ANALYSIS_PROMPT = """당신은 뷰티/살롱 업계 전문 이미지 분석가입니다.
제공된 시술 사진을 분석하여 다음 정보를 JSON 형식으로 추출해주세요.

분석 항목:
1. service_type: 시술 유형 (nail, hair, makeup, lash, skin 중 하나)
2. style_category: 스타일 카테고리 (minimal, luxury, trendy, classic, natural, cute, chic, elegant 중 하나)
3. season_trend: 시즌/트렌드 (예: "S/S 2025", "F/W 트렌드", "웨딩", "데일리", "파티")
4. dominant_colors: 주요 색상 3개 (hex 코드 배열, 예: ["#FFB6C1", "#FFFFFF", "#000000"])
5. technique_tags: 기법/디테일 태그 (최대 5개, 예: ["프렌치", "글리터", "그라데이션"])
6. mood_tags: 분위기/감성 태그 (최대 3개, 예: ["청순", "화려", "시크"])
7. ai_description: 인스타그램 포스팅용 짧은 설명 (한국어, 2-3문장)
8. suggested_hashtags: 추천 해시태그 (최대 10개, # 제외)
9. confidence_score: 분석 신뢰도 (0.0 ~ 1.0)

응답은 반드시 유효한 JSON 형식이어야 합니다. 다른 텍스트 없이 JSON만 출력하세요.
"""


class VisionService:
    """Vision AI 서비스

    OpenAI Vision API를 사용하여 뷰티 시술 이미지를 분석합니다.
    분석 결과는 StyleTag 모델에 저장되어 스타일북 기능에 활용됩니다.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.client = httpx.AsyncClient(timeout=60.0)
        self.api_key = settings.openai_api_key
        self.model = settings.openai_model  # gpt-4o

    async def close(self) -> None:
        """HTTP 클라이언트 종료"""
        await self.client.aclose()

    async def analyze_image(
        self,
        shop_id: UUID,
        image_url: str,
        thumbnail_url: str | None = None,
    ) -> StyleTag:
        """이미지를 분석하고 StyleTag를 생성합니다.

        Args:
            shop_id: 매장 ID
            image_url: 분석할 이미지 URL (공개 접근 가능해야 함)
            thumbnail_url: 썸네일 URL (선택)

        Returns:
            StyleTag: 분석 결과가 저장된 StyleTag 객체
        """
        # StyleTag 생성 (pending 상태)
        style_tag = StyleTag(
            shop_id=shop_id,
            image_url=image_url,
            thumbnail_url=thumbnail_url,
            analysis_status="analyzing",
        )
        self.db.add(style_tag)
        await self.db.commit()
        await self.db.refresh(style_tag)

        try:
            # Vision API 호출
            analysis_result = await self._call_vision_api(image_url)

            # 결과 파싱 및 저장
            style_tag.service_type = analysis_result.get("service_type")
            style_tag.style_category = analysis_result.get("style_category")
            style_tag.season_trend = analysis_result.get("season_trend")
            style_tag.dominant_colors = analysis_result.get("dominant_colors", [])
            style_tag.technique_tags = analysis_result.get("technique_tags", [])
            style_tag.mood_tags = analysis_result.get("mood_tags", [])
            style_tag.ai_description = analysis_result.get("ai_description")
            style_tag.suggested_hashtags = analysis_result.get("suggested_hashtags", [])
            style_tag.confidence_score = analysis_result.get("confidence_score", 0.8)
            style_tag.raw_ai_response = analysis_result
            style_tag.analysis_status = "completed"
            style_tag.analyzed_at = datetime.now(UTC)

            await self.db.commit()
            await self.db.refresh(style_tag)

            return style_tag

        except Exception as e:
            # 실패 시 상태 업데이트
            style_tag.analysis_status = "failed"
            await self.db.commit()
            raise VisionServiceError(f"이미지 분석 실패: {str(e)}") from e

    async def _call_vision_api(self, image_url: str) -> dict[str, Any]:
        """OpenAI Vision API 호출"""
        if not self.api_key:
            raise VisionServiceError("OpenAI API 키가 설정되지 않았습니다.")

        response = await self.client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": self.model,
                "messages": [
                    {
                        "role": "system",
                        "content": BEAUTY_ANALYSIS_PROMPT,
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": image_url,
                                    "detail": "high",
                                },
                            },
                        ],
                    },
                ],
                "max_tokens": 1000,
                "temperature": 0.3,
            },
        )

        if response.status_code != 200:
            error_data = response.json()
            raise VisionServiceError(
                f"OpenAI API 오류: {error_data.get('error', {}).get('message', 'Unknown error')}",
                status_code=response.status_code,
            )

        data = response.json()
        content = data["choices"][0]["message"]["content"]

        # JSON 파싱
        try:
            # 마크다운 코드 블록 제거
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            content = content.strip()

            return json.loads(content)
        except json.JSONDecodeError as e:
            raise VisionServiceError(f"AI 응답 파싱 실패: {str(e)}") from e

    async def analyze_image_from_base64(
        self,
        shop_id: UUID,
        image_data: str,
        image_format: str = "jpeg",
    ) -> StyleTag:
        """Base64 이미지를 분석합니다.

        Args:
            shop_id: 매장 ID
            image_data: Base64 인코딩된 이미지 데이터
            image_format: 이미지 포맷 (jpeg, png, gif, webp)

        Returns:
            StyleTag: 분석 결과
        """
        data_url = f"data:image/{image_format};base64,{image_data}"
        return await self.analyze_image(shop_id, data_url)

    async def get_style_tags(
        self,
        shop_id: UUID,
        service_type: str | None = None,
        style_category: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[StyleTag], int]:
        """매장의 스타일 태그 목록 조회

        Args:
            shop_id: 매장 ID
            service_type: 시술 유형 필터
            style_category: 스타일 카테고리 필터
            limit: 최대 결과 수
            offset: 시작 위치

        Returns:
            tuple: (스타일 태그 목록, 전체 개수)
        """
        from sqlalchemy import func

        query = select(StyleTag).where(
            StyleTag.shop_id == shop_id,
            StyleTag.analysis_status == "completed",
        )

        if service_type:
            query = query.where(StyleTag.service_type == service_type)
        if style_category:
            query = query.where(StyleTag.style_category == style_category)

        # 총 개수
        count_query = select(func.count()).select_from(query.subquery())
        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0

        # 결과 조회
        query = query.order_by(StyleTag.created_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(query)
        style_tags = list(result.scalars().all())

        return style_tags, total

    async def get_style_tag_by_id(
        self,
        shop_id: UUID,
        style_tag_id: UUID,
    ) -> StyleTag | None:
        """특정 스타일 태그 조회"""
        result = await self.db.execute(
            select(StyleTag).where(
                StyleTag.id == style_tag_id,
                StyleTag.shop_id == shop_id,
            )
        )
        return result.scalar_one_or_none()

    async def delete_style_tag(
        self,
        shop_id: UUID,
        style_tag_id: UUID,
    ) -> bool:
        """스타일 태그 삭제"""
        style_tag = await self.get_style_tag_by_id(shop_id, style_tag_id)
        if not style_tag:
            return False

        await self.db.delete(style_tag)
        await self.db.commit()
        return True

    async def get_style_statistics(self, shop_id: UUID) -> dict[str, Any]:
        """스타일 통계 조회

        Returns:
            dict: {
                "total_count": int,
                "by_service_type": {"nail": 10, "hair": 5, ...},
                "by_style_category": {"minimal": 8, "trendy": 7, ...},
                "popular_colors": ["#FFB6C1", "#FFFFFF", ...],
                "popular_tags": ["글리터", "프렌치", ...]
            }
        """
        from sqlalchemy import func

        # 전체 개수
        total_result = await self.db.execute(
            select(func.count(StyleTag.id)).where(
                StyleTag.shop_id == shop_id,
                StyleTag.analysis_status == "completed",
            )
        )
        total_count = total_result.scalar() or 0

        # 서비스 유형별 개수
        service_result = await self.db.execute(
            select(StyleTag.service_type, func.count(StyleTag.id))
            .where(
                StyleTag.shop_id == shop_id,
                StyleTag.analysis_status == "completed",
                StyleTag.service_type.isnot(None),
            )
            .group_by(StyleTag.service_type)
        )
        by_service_type = {row[0]: row[1] for row in service_result.all()}

        # 스타일 카테고리별 개수
        style_result = await self.db.execute(
            select(StyleTag.style_category, func.count(StyleTag.id))
            .where(
                StyleTag.shop_id == shop_id,
                StyleTag.analysis_status == "completed",
                StyleTag.style_category.isnot(None),
            )
            .group_by(StyleTag.style_category)
        )
        by_style_category = {row[0]: row[1] for row in style_result.all()}

        return {
            "total_count": total_count,
            "by_service_type": by_service_type,
            "by_style_category": by_style_category,
        }

    async def suggest_content_for_style(
        self,
        style_tag: StyleTag,
    ) -> dict[str, Any]:
        """스타일 태그 기반 콘텐츠 제안

        인스타그램 포스팅용 캡션과 해시태그를 제안합니다.
        """
        caption_parts = []

        # 설명 추가
        if style_tag.ai_description:
            caption_parts.append(style_tag.ai_description)

        # 기법 태그를 자연스럽게 언급
        if style_tag.technique_tags:
            techniques = ", ".join(style_tag.technique_tags[:3])
            caption_parts.append(f"#{techniques.replace(', ', ' #')}")

        # 해시태그
        hashtags = ["살롱메이트"]
        if style_tag.service_type:
            type_tags = {
                "nail": ["네일", "네일아트", "젤네일"],
                "hair": ["헤어", "헤어스타일", "헤어살롱"],
                "makeup": ["메이크업", "뷰티", "화장"],
                "lash": ["속눈썹", "래쉬", "속눈썹연장"],
                "skin": ["피부관리", "스킨케어", "에스테틱"],
            }
            hashtags.extend(type_tags.get(style_tag.service_type, []))

        hashtags.extend(style_tag.suggested_hashtags or [])

        return {
            "caption": "\n\n".join(caption_parts),
            "hashtags": list(set(hashtags))[:15],
        }
