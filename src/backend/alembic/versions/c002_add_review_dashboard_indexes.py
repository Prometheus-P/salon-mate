"""add_review_dashboard_indexes

Revision ID: c002_review_idx
Revises: c001_posts
Create Date: 2025-12-02

"""
from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'c002_review_idx'
down_revision: str | Sequence[str] | None = 'c001_posts'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Add indexes for dashboard queries on reviews table."""
    # Composite index for pending reviews lookup
    op.create_index(
        'idx_reviews_shop_status',
        'reviews',
        ['shop_id', 'status']
    )

    # Composite index for trend queries
    op.create_index(
        'idx_reviews_shop_date',
        'reviews',
        ['shop_id', 'review_date']
    )


def downgrade() -> None:
    """Remove dashboard indexes from reviews table."""
    op.drop_index('idx_reviews_shop_date', table_name='reviews')
    op.drop_index('idx_reviews_shop_status', table_name='reviews')
