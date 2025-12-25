"""
리포트 서비스 (Agency Mode)
월간 성과 리포트 생성 - HTML 기반
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.review import Review
from models.shop import Shop
from models.user import User


class ReportService:
    """리포트 생성 서비스"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_monthly_report_data(
        self,
        user: User,
        shop_id: UUID,
        year: int,
        month: int,
    ) -> dict[str, Any]:
        """월간 리포트 데이터를 수집합니다."""

        # 날짜 범위 계산
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)

        # 이전 달 날짜 범위 (비교용)
        if month == 1:
            prev_start = datetime(year - 1, 12, 1)
            prev_end = start_date
        else:
            prev_start = datetime(year, month - 1, 1)
            prev_end = start_date

        # 샵 정보 조회
        shop_result = await self.db.execute(
            select(Shop).where(Shop.id == shop_id).where(Shop.user_id == user.id)
        )
        shop = shop_result.scalar_one_or_none()
        if not shop:
            raise ValueError("매장을 찾을 수 없습니다")

        # 이번 달 리뷰 통계
        current_stats = await self._get_period_stats(shop_id, start_date, end_date)

        # 지난 달 리뷰 통계 (비교용)
        prev_stats = await self._get_period_stats(shop_id, prev_start, prev_end)

        # 평점 분포
        rating_dist = await self._get_rating_distribution(shop_id, start_date, end_date)

        # 일별 트렌드
        daily_trend = await self._get_daily_trend(shop_id, start_date, end_date)

        # 변화율 계산
        def calc_change(current: float, previous: float) -> float:
            if previous == 0:
                return 100.0 if current > 0 else 0.0
            return round(((current - previous) / previous) * 100, 1)

        return {
            "shop": {
                "id": str(shop.id),
                "name": shop.name,
                "type": shop.type,
            },
            "period": {
                "year": year,
                "month": month,
                "label": f"{year}년 {month}월",
            },
            "summary": {
                "total_reviews": {
                    "current": current_stats["total_reviews"],
                    "previous": prev_stats["total_reviews"],
                    "change": calc_change(
                        current_stats["total_reviews"], prev_stats["total_reviews"]
                    ),
                },
                "average_rating": {
                    "current": round(current_stats["average_rating"], 2),
                    "previous": round(prev_stats["average_rating"], 2),
                    "change": calc_change(
                        current_stats["average_rating"], prev_stats["average_rating"]
                    ),
                },
                "response_rate": {
                    "current": round(current_stats["response_rate"], 1),
                    "previous": round(prev_stats["response_rate"], 1),
                    "change": calc_change(
                        current_stats["response_rate"], prev_stats["response_rate"]
                    ),
                },
                "new_reviews": current_stats["total_reviews"],
            },
            "rating_distribution": rating_dist,
            "daily_trend": daily_trend,
            "generated_at": datetime.now().isoformat(),
        }

    async def _get_period_stats(
        self, shop_id: UUID, start_date: datetime, end_date: datetime
    ) -> dict[str, Any]:
        """특정 기간의 리뷰 통계를 계산합니다."""

        # 총 리뷰 수
        total_result = await self.db.execute(
            select(func.count(Review.id))
            .where(Review.shop_id == shop_id)
            .where(Review.review_date >= start_date)
            .where(Review.review_date < end_date)
        )
        total_reviews = total_result.scalar() or 0

        # 평균 평점
        avg_result = await self.db.execute(
            select(func.avg(Review.rating))
            .where(Review.shop_id == shop_id)
            .where(Review.review_date >= start_date)
            .where(Review.review_date < end_date)
        )
        average_rating = avg_result.scalar() or 0.0

        # 응답률
        replied_result = await self.db.execute(
            select(func.count(Review.id))
            .where(Review.shop_id == shop_id)
            .where(Review.review_date >= start_date)
            .where(Review.review_date < end_date)
            .where(Review.status == "replied")
        )
        replied_count = replied_result.scalar() or 0

        response_rate = (replied_count / total_reviews * 100) if total_reviews > 0 else 0

        return {
            "total_reviews": total_reviews,
            "average_rating": float(average_rating),
            "response_rate": response_rate,
            "replied_count": replied_count,
        }

    async def _get_rating_distribution(
        self, shop_id: UUID, start_date: datetime, end_date: datetime
    ) -> list[dict[str, Any]]:
        """평점 분포를 계산합니다."""

        result = await self.db.execute(
            select(Review.rating, func.count(Review.id).label("count"))
            .where(Review.shop_id == shop_id)
            .where(Review.review_date >= start_date)
            .where(Review.review_date < end_date)
            .group_by(Review.rating)
            .order_by(Review.rating.desc())
        )
        rows = result.all()

        total = sum(row.count for row in rows)
        distribution = []

        for rating in [5, 4, 3, 2, 1]:
            count = next((row.count for row in rows if row.rating == rating), 0)
            percent = (count / total * 100) if total > 0 else 0
            distribution.append(
                {
                    "rating": rating,
                    "count": count,
                    "percent": round(percent, 1),
                }
            )

        return distribution

    async def _get_daily_trend(
        self, shop_id: UUID, start_date: datetime, end_date: datetime
    ) -> list[dict[str, Any]]:
        """일별 리뷰 트렌드를 계산합니다."""

        result = await self.db.execute(
            select(
                func.date(Review.review_date).label("date"),
                func.count(Review.id).label("count"),
                func.avg(Review.rating).label("avg_rating"),
            )
            .where(Review.shop_id == shop_id)
            .where(Review.review_date >= start_date)
            .where(Review.review_date < end_date)
            .group_by(func.date(Review.review_date))
            .order_by(func.date(Review.review_date))
        )
        rows = result.all()

        return [
            {
                "date": str(row.date),
                "count": row.count,
                "avg_rating": round(float(row.avg_rating or 0), 2),
            }
            for row in rows
        ]

    def generate_html_report(self, data: dict[str, Any]) -> str:
        """HTML 리포트를 생성합니다."""

        # 평점 분포 바 차트 HTML
        rating_bars = ""
        for item in data["rating_distribution"]:
            rating_bars += f"""
            <div class="rating-row">
                <span class="rating-label">{item['rating']}★</span>
                <div class="rating-bar-container">
                    <div class="rating-bar" style="width: {item['percent']}%"></div>
                </div>
                <span class="rating-percent">{item['percent']}%</span>
                <span class="rating-count">({item['count']})</span>
            </div>
            """

        # 일별 트렌드 (단순 텍스트로 표시)
        trend_rows = ""
        for item in data["daily_trend"][-7:]:  # 최근 7일만 표시
            trend_rows += f"""
            <tr>
                <td>{item['date']}</td>
                <td>{item['count']}</td>
                <td>{item['avg_rating']}</td>
            </tr>
            """

        # 변화 표시 아이콘
        def change_indicator(change: float) -> str:
            if change > 0:
                return f'<span class="change positive">▲ {change}%</span>'
            elif change < 0:
                return f'<span class="change negative">▼ {abs(change)}%</span>'
            return '<span class="change neutral">-</span>'

        summary = data["summary"]

        html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{data['shop']['name']} - {data['period']['label']} 리포트</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            color: #333;
            line-height: 1.5;
        }}
        .report {{
            max-width: 800px;
            margin: 20px auto;
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .header {{
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: white;
            padding: 30px;
        }}
        .header h1 {{
            font-size: 24px;
            margin-bottom: 8px;
        }}
        .header p {{
            opacity: 0.9;
            font-size: 14px;
        }}
        .content {{
            padding: 30px;
        }}
        .section {{
            margin-bottom: 30px;
        }}
        .section-title {{
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
        }}
        .metrics-grid {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
        }}
        .metric-card {{
            background: #f9fafb;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
        }}
        .metric-value {{
            font-size: 28px;
            font-weight: 700;
            color: #1f2937;
        }}
        .metric-label {{
            font-size: 12px;
            color: #6b7280;
            margin-top: 4px;
        }}
        .change {{
            display: block;
            font-size: 12px;
            margin-top: 8px;
        }}
        .change.positive {{
            color: #10b981;
        }}
        .change.negative {{
            color: #ef4444;
        }}
        .change.neutral {{
            color: #9ca3af;
        }}
        .rating-row {{
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
        }}
        .rating-label {{
            width: 40px;
            font-weight: 500;
        }}
        .rating-bar-container {{
            flex: 1;
            height: 20px;
            background: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
        }}
        .rating-bar {{
            height: 100%;
            background: linear-gradient(90deg, #fbbf24, #f59e0b);
            border-radius: 4px;
        }}
        .rating-percent {{
            width: 50px;
            text-align: right;
            font-weight: 500;
        }}
        .rating-count {{
            width: 40px;
            font-size: 12px;
            color: #9ca3af;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
        }}
        th, td {{
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }}
        th {{
            background: #f9fafb;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            color: #6b7280;
        }}
        .footer {{
            text-align: center;
            padding: 20px;
            color: #9ca3af;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
        }}
        @media print {{
            body {{
                background: white;
            }}
            .report {{
                box-shadow: none;
                margin: 0;
            }}
            .header {{
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }}
        }}
    </style>
</head>
<body>
    <div class="report">
        <div class="header">
            <h1>{data['shop']['name']}</h1>
            <p>{data['period']['label']} 마케팅 성과 리포트</p>
        </div>

        <div class="content">
            <div class="section">
                <h2 class="section-title">📊 핵심 지표</h2>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value">{summary['total_reviews']['current']}</div>
                        <div class="metric-label">총 리뷰</div>
                        {change_indicator(summary['total_reviews']['change'])}
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">{summary['average_rating']['current']}</div>
                        <div class="metric-label">평균 평점</div>
                        {change_indicator(summary['average_rating']['change'])}
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">{summary['response_rate']['current']}%</div>
                        <div class="metric-label">응답률</div>
                        {change_indicator(summary['response_rate']['change'])}
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">+{summary['new_reviews']}</div>
                        <div class="metric-label">신규 리뷰</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2 class="section-title">⭐ 평점 분포</h2>
                {rating_bars}
            </div>

            <div class="section">
                <h2 class="section-title">📈 최근 리뷰 추이</h2>
                <table>
                    <thead>
                        <tr>
                            <th>날짜</th>
                            <th>리뷰 수</th>
                            <th>평균 평점</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trend_rows if trend_rows else '<tr><td colspan="3" style="text-align:center;color:#9ca3af;">데이터 없음</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="footer">
            <p>SalonMate에서 자동 생성 | {data['generated_at'][:10]}</p>
        </div>
    </div>
</body>
</html>"""

        return html
