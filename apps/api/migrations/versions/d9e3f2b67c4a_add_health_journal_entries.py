"""Add health journal entries table

Revision ID: d9e3f2b67c4a
Revises: c8d2f1a56e3b
Create Date: 2026-04-11 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.database import UUID

# revision identifiers, used by Alembic.
revision: str = "d9e3f2b67c4a"
down_revision: Union[str, None] = "c8d2f1a56e3b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "health_journal_entries",
        sa.Column("id", UUID(), nullable=False),
        sa.Column("user_id", UUID(), nullable=False),
        sa.Column("entry_date", sa.Date(), nullable=False),
        sa.Column("energy_level", sa.Integer(), nullable=True),
        sa.Column("mood_level", sa.Integer(), nullable=True),
        sa.Column("sleep_quality", sa.Integer(), nullable=True),
        sa.Column("stress_level", sa.Integer(), nullable=True),
        sa.Column("symptoms", sa.JSON(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_health_journal_entries_user_id", "health_journal_entries", ["user_id"])
    op.create_index(
        "ix_health_journal_entries_user_date",
        "health_journal_entries",
        ["user_id", "entry_date"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_health_journal_entries_user_date", table_name="health_journal_entries")
    op.drop_index("ix_health_journal_entries_user_id", table_name="health_journal_entries")
    op.drop_table("health_journal_entries")
