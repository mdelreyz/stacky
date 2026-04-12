"""Add notification delivery log table

Revision ID: f1a2b3c4d5e6
Revises: d9e3f2b67c4a
Create Date: 2026-04-11 23:30:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.database import UUID

# revision identifiers, used by Alembic.
revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, None] = "d9e3f2b67c4a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notification_deliveries",
        sa.Column("id", UUID(), primary_key=True),
        sa.Column("user_id", UUID(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("notification_type", sa.String(length=50), nullable=False, server_default="scheduled_reminder"),
        sa.Column("target_date", sa.Date(), nullable=False),
        sa.Column("window", sa.String(length=32), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint(
            "user_id",
            "notification_type",
            "target_date",
            "window",
            name="uq_notification_deliveries_user_type_date_window",
        ),
    )
    op.create_index("ix_notification_deliveries_user_id", "notification_deliveries", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_notification_deliveries_user_id", table_name="notification_deliveries")
    op.drop_table("notification_deliveries")
