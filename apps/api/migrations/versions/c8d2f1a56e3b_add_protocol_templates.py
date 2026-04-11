"""Add protocol templates table

Revision ID: c8d2f1a56e3b
Revises: b7f3e2a84c1d
Create Date: 2026-04-11 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.database import UUID

# revision identifiers, used by Alembic.
revision: str = "c8d2f1a56e3b"
down_revision: Union[str, None] = "b7f3e2a84c1d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "protocol_templates",
        sa.Column("id", UUID(), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(30), nullable=False),
        sa.Column("difficulty", sa.String(20), nullable=True),
        sa.Column("icon", sa.String(30), nullable=True),
        sa.Column("is_featured", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("items", sa.JSON(), nullable=True),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("adoption_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_protocol_templates_category", "protocol_templates", ["category"])


def downgrade() -> None:
    op.drop_index("ix_protocol_templates_category", table_name="protocol_templates")
    op.drop_table("protocol_templates")
