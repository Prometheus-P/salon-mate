"""
Dashboard API 성능 테스트
T079: 대시보드 로드 3초 미만 검증
"""

import asyncio
import time

import pytest
from httpx import AsyncClient

from core.security import create_tokens, hash_password
from models.shop import Shop
from models.user import User


@pytest.fixture
async def perf_test_user(db_session):
    """성능 테스트용 사용자 및 매장 생성"""
    user = User(
        email="perftest@example.com",
        name="성능 테스트 사용자",
        password_hash=hash_password("password123"),
        auth_provider="email",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    shop = Shop(
        user_id=user.id,
        name="성능 테스트 매장",
        type="hair",
    )
    db_session.add(shop)
    await db_session.commit()
    await db_session.refresh(shop)

    access_token, _, _ = create_tokens(str(user.id))
    return {"user": user, "shop": shop, "token": access_token}


class TestDashboardPerformance:
    """대시보드 API 성능 테스트"""

    # 성능 목표 (밀리초)
    TARGET_API_RESPONSE_MS = 500  # 각 API < 500ms
    TARGET_TOTAL_LOAD_MS = 3000  # 전체 로드 < 3초

    @pytest.mark.asyncio
    async def test_review_stats_response_time(
        self, client: AsyncClient, perf_test_user
    ):
        """리뷰 통계 API 응답 시간 < 500ms"""
        shop_id = perf_test_user["shop"].id
        headers = {"Authorization": f"Bearer {perf_test_user['token']}"}

        start = time.perf_counter()
        response = await client.get(
            f"/v1/dashboard/{shop_id}/stats",
            headers=headers,
        )
        elapsed_ms = (time.perf_counter() - start) * 1000

        assert response.status_code == 200
        assert elapsed_ms < self.TARGET_API_RESPONSE_MS, (
            f"Review stats API took {elapsed_ms:.2f}ms, target is {self.TARGET_API_RESPONSE_MS}ms"
        )
        print(f"\n✓ Review stats: {elapsed_ms:.2f}ms")

    @pytest.mark.asyncio
    async def test_calendar_response_time(
        self, client: AsyncClient, perf_test_user
    ):
        """캘린더 API 응답 시간 < 500ms"""
        shop_id = perf_test_user["shop"].id
        headers = {"Authorization": f"Bearer {perf_test_user['token']}"}

        start = time.perf_counter()
        response = await client.get(
            f"/v1/dashboard/{shop_id}/calendar",
            headers=headers,
            params={"start_date": "2025-01-01", "end_date": "2025-01-31"},
        )
        elapsed_ms = (time.perf_counter() - start) * 1000

        assert response.status_code == 200
        assert elapsed_ms < self.TARGET_API_RESPONSE_MS, (
            f"Calendar API took {elapsed_ms:.2f}ms, target is {self.TARGET_API_RESPONSE_MS}ms"
        )
        print(f"\n✓ Calendar: {elapsed_ms:.2f}ms")

    @pytest.mark.asyncio
    async def test_engagement_response_time(
        self, client: AsyncClient, perf_test_user
    ):
        """인게이지먼트 API 응답 시간 < 500ms"""
        shop_id = perf_test_user["shop"].id
        headers = {"Authorization": f"Bearer {perf_test_user['token']}"}

        start = time.perf_counter()
        response = await client.get(
            f"/v1/dashboard/{shop_id}/engagement",
            headers=headers,
        )
        elapsed_ms = (time.perf_counter() - start) * 1000

        assert response.status_code == 200
        assert elapsed_ms < self.TARGET_API_RESPONSE_MS, (
            f"Engagement API took {elapsed_ms:.2f}ms, target is {self.TARGET_API_RESPONSE_MS}ms"
        )
        print(f"\n✓ Engagement: {elapsed_ms:.2f}ms")

    @pytest.mark.asyncio
    async def test_trends_response_time(
        self, client: AsyncClient, perf_test_user
    ):
        """트렌드 API 응답 시간 < 500ms"""
        shop_id = perf_test_user["shop"].id
        headers = {"Authorization": f"Bearer {perf_test_user['token']}"}

        start = time.perf_counter()
        response = await client.get(
            f"/v1/dashboard/{shop_id}/trends",
            headers=headers,
            params={"period": "month"},
        )
        elapsed_ms = (time.perf_counter() - start) * 1000

        assert response.status_code == 200
        assert elapsed_ms < self.TARGET_API_RESPONSE_MS, (
            f"Trends API took {elapsed_ms:.2f}ms, target is {self.TARGET_API_RESPONSE_MS}ms"
        )
        print(f"\n✓ Trends: {elapsed_ms:.2f}ms")

    @pytest.mark.asyncio
    async def test_pending_reviews_response_time(
        self, client: AsyncClient, perf_test_user
    ):
        """대기 리뷰 API 응답 시간 < 500ms"""
        shop_id = perf_test_user["shop"].id
        headers = {"Authorization": f"Bearer {perf_test_user['token']}"}

        start = time.perf_counter()
        response = await client.get(
            f"/v1/dashboard/{shop_id}/pending-reviews",
            headers=headers,
        )
        elapsed_ms = (time.perf_counter() - start) * 1000

        assert response.status_code == 200
        assert elapsed_ms < self.TARGET_API_RESPONSE_MS, (
            f"Pending reviews API took {elapsed_ms:.2f}ms, target is {self.TARGET_API_RESPONSE_MS}ms"
        )
        print(f"\n✓ Pending reviews: {elapsed_ms:.2f}ms")

    @pytest.mark.asyncio
    async def test_parallel_dashboard_load(
        self, client: AsyncClient, perf_test_user
    ):
        """병렬 대시보드 로드 < 3초 (모든 API 동시 호출)"""
        shop_id = perf_test_user["shop"].id
        headers = {"Authorization": f"Bearer {perf_test_user['token']}"}

        async def fetch_stats():
            return await client.get(
                f"/v1/dashboard/{shop_id}/stats", headers=headers
            )

        async def fetch_calendar():
            return await client.get(
                f"/v1/dashboard/{shop_id}/calendar",
                headers=headers,
                params={"start_date": "2025-01-01", "end_date": "2025-01-31"},
            )

        async def fetch_engagement():
            return await client.get(
                f"/v1/dashboard/{shop_id}/engagement", headers=headers
            )

        async def fetch_trends():
            return await client.get(
                f"/v1/dashboard/{shop_id}/trends",
                headers=headers,
                params={"period": "month"},
            )

        async def fetch_pending():
            return await client.get(
                f"/v1/dashboard/{shop_id}/pending-reviews", headers=headers
            )

        start = time.perf_counter()
        results = await asyncio.gather(
            fetch_stats(),
            fetch_calendar(),
            fetch_engagement(),
            fetch_trends(),
            fetch_pending(),
        )
        total_ms = (time.perf_counter() - start) * 1000

        # 모든 응답이 성공인지 확인
        for i, response in enumerate(results):
            assert response.status_code == 200, f"API {i} failed with {response.status_code}"

        assert total_ms < self.TARGET_TOTAL_LOAD_MS, (
            f"Parallel load took {total_ms:.2f}ms, target is {self.TARGET_TOTAL_LOAD_MS}ms"
        )
        print(f"\n✓ Parallel dashboard load: {total_ms:.2f}ms (target: <{self.TARGET_TOTAL_LOAD_MS}ms)")

    @pytest.mark.asyncio
    async def test_response_has_timing_header(
        self, client: AsyncClient, perf_test_user
    ):
        """응답에 X-Process-Time-Ms 헤더가 포함되어야 함"""
        shop_id = perf_test_user["shop"].id
        headers = {"Authorization": f"Bearer {perf_test_user['token']}"}

        response = await client.get(
            f"/v1/dashboard/{shop_id}/stats",
            headers=headers,
        )

        assert response.status_code == 200
        assert "x-process-time-ms" in response.headers
        timing = float(response.headers["x-process-time-ms"])
        assert timing > 0
        print(f"\n✓ Server timing header: {timing:.2f}ms")
