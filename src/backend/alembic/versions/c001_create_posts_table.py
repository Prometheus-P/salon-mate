"""create_posts_table

Revision ID: c001_posts
Revises: b74f4d9e2ab3
Create Date: 2025-12-02

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c001_posts"
down_revision: str | Sequence[str] | None = "b74f4d9e2ab3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create posts table for Instagram posts."""
    # Get dialect name for conditional logic
    bind = op.get_bind()
    dialect = bind.dialect.name

    # Use GUID type from models.base for UUID compatibility
    from models.base import GUID

    # Choose JSON type based on dialect
    if dialect == "postgresql":
        from sqlalchemy.dialects import postgresql

        uuid_type: sa.types.TypeEngine = postgresql.UUID(as_uuid=True)
        json_type: sa.types.TypeEngine = postgresql.JSONB(astext_type=sa.Text())
    else:
        uuid_type = GUID()
        json_type = sa.JSON()

    op.create_table(
        "posts",
        sa.Column("id", uuid_type, nullable=False),
        sa.Column("shop_id", uuid_type, nullable=False),
        sa.Column("instagram_post_id", sa.String(255), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("image_url", sa.String(500), nullable=False),
        sa.Column("caption", sa.Text(), nullable=True),
        sa.Column(
            "hashtags",
            json_type,
            nullable=False,
            server_default="[]",
        ),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("likes_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("comments_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("reach_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("engagement_synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
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

    # Add check constraint for status (SQLite-compatible syntax)
    if dialect != "sqlite":
        op.create_check_constraint(
            "chk_post_status",
            "posts",
            "status IN ('draft', 'scheduled', 'published', 'failed')",
        )

    # Create indexes
    op.create_index("idx_posts_shop_id", "posts", ["shop_id"])
    op.create_index("idx_posts_status", "posts", ["status"])
    op.create_index("idx_posts_scheduled_at", "posts", ["scheduled_at"])

    # Conditional unique index with WHERE clause (PostgreSQL only)
    if dialect == "postgresql":
        op.create_index(
            "idx_posts_instagram_post_id",
            "posts",
            ["instagram_post_id"],
            unique=True,
            postgresql_where=sa.text("instagram_post_id IS NOT NULL"),
        )

        # Create updated_at trigger (PostgreSQL only)
        op.execute("""
            CREATE TRIGGER set_posts_updated_at
                BEFORE UPDATE ON posts
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        """)
    else:
        # SQLite: simple unique index without WHERE clause
        op.create_index(
            "idx_posts_instagram_post_id",
            "posts",
            ["instagram_post_id"],
            unique=True,
        )


def downgrade() -> None:
    """Drop posts table."""
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == "postgresql":
        op.execute("DROP TRIGGER IF EXISTS set_posts_updated_at ON posts")
        op.drop_constraint("chk_post_status", "posts", type_="check")

    op.drop_index("idx_posts_instagram_post_id", table_name="posts")
    op.drop_index("idx_posts_scheduled_at", table_name="posts")
    op.drop_index("idx_posts_status", table_name="posts")
    op.drop_index("idx_posts_shop_id", table_name="posts")
    op.drop_table("posts")
