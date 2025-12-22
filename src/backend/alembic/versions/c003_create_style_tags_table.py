"""create_style_tags_table

Revision ID: c003_style_tags
Revises: c002_review_idx
Create Date: 2025-12-22

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c003_style_tags"
down_revision: str | Sequence[str] | None = "c002_review_idx"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create style_tags table for Vision AI analysis."""
    op.create_table(
        "style_tags",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("shop_id", postgresql.UUID(as_uuid=True), nullable=False),
        # 이미지 정보
        sa.Column("image_url", sa.String(500), nullable=False),
        sa.Column("thumbnail_url", sa.String(500), nullable=True),
        # 분석 상태
        sa.Column(
            "analysis_status",
            sa.String(20),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("analyzed_at", sa.DateTime(timezone=True), nullable=True),
        # AI 분석 결과
        sa.Column("service_type", sa.String(50), nullable=True),
        sa.Column("style_category", sa.String(50), nullable=True),
        sa.Column("season_trend", sa.String(100), nullable=True),
        sa.Column(
            "dominant_colors",
            postgresql.JSON(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
        ),
        sa.Column(
            "technique_tags",
            postgresql.JSON(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
        ),
        sa.Column(
            "mood_tags",
            postgresql.JSON(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
        ),
        sa.Column("ai_description", sa.Text(), nullable=True),
        sa.Column(
            "suggested_hashtags",
            postgresql.JSON(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
        ),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column(
            "raw_ai_response",
            postgresql.JSON(astext_type=sa.Text()),
            nullable=True,
        ),
        # 타임스탬프
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["shop_id"], ["shops.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # 인덱스 생성
    op.create_index("ix_style_tags_shop_id", "style_tags", ["shop_id"])
    op.create_index("ix_style_tags_analysis_status", "style_tags", ["analysis_status"])
    op.create_index("ix_style_tags_service_type", "style_tags", ["service_type"])
    op.create_index("ix_style_tags_style_category", "style_tags", ["style_category"])

    # updated_at 트리거 생성
    op.execute("""
        CREATE TRIGGER set_style_tags_updated_at
            BEFORE UPDATE ON style_tags
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    """)


def downgrade() -> None:
    """Drop style_tags table."""
    # 트리거 삭제
    op.execute("DROP TRIGGER IF EXISTS set_style_tags_updated_at ON style_tags")

    # 인덱스 삭제
    op.drop_index("ix_style_tags_style_category", table_name="style_tags")
    op.drop_index("ix_style_tags_service_type", table_name="style_tags")
    op.drop_index("ix_style_tags_analysis_status", table_name="style_tags")
    op.drop_index("ix_style_tags_shop_id", table_name="style_tags")

    # 테이블 삭제
    op.drop_table("style_tags")
