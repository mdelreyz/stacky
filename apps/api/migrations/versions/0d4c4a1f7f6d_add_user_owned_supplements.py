"""Add owner scope for custom supplements

Revision ID: 0d4c4a1f7f6d
Revises: a3f7c2d91e4b
Create Date: 2026-04-10 11:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.database import UUID

# revision identifiers, used by Alembic.
revision: str = "0d4c4a1f7f6d"
down_revision: Union[str, None] = "a3f7c2d91e4b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("supplements") as batch_op:
        batch_op.add_column(sa.Column("created_by_user_id", UUID(), nullable=True))
        batch_op.create_index(op.f("ix_supplements_created_by_user_id"), ["created_by_user_id"], unique=False)
        batch_op.create_foreign_key(
            "fk_supplements_created_by_user_id_users",
            "users",
            ["created_by_user_id"],
            ["id"],
            ondelete="CASCADE",
        )


def downgrade() -> None:
    with op.batch_alter_table("supplements") as batch_op:
        batch_op.drop_constraint("fk_supplements_created_by_user_id_users", type_="foreignkey")
        batch_op.drop_index(op.f("ix_supplements_created_by_user_id"))
        batch_op.drop_column("created_by_user_id")
