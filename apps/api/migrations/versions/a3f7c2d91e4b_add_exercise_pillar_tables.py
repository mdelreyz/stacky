"""Add exercise pillar tables

Revision ID: a3f7c2d91e4b
Revises: e5e80fb951ad
Create Date: 2026-04-09 22:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from app.database import UUID

# revision identifiers, used by Alembic.
revision: str = "a3f7c2d91e4b"
down_revision: Union[str, None] = "e5e80fb951ad"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enum types
    exercise_category_enum = sa.Enum(
        "compound", "isolation", "bodyweight", "cardio", "flexibility", "plyometric", "olympic",
        name="exercise_category_enum",
    )
    muscle_group_enum = sa.Enum(
        "chest", "back", "shoulders", "biceps", "triceps", "forearms",
        "quadriceps", "hamstrings", "glutes", "calves", "core", "full_body", "cardio",
        name="muscle_group_enum",
    )
    exercise_equipment_enum = sa.Enum(
        "barbell", "dumbbell", "cable", "machine", "smith_machine", "bodyweight",
        "kettlebell", "resistance_band", "ez_bar", "trap_bar", "none",
        name="exercise_equipment_enum",
    )
    week_day_enum = sa.Enum(
        "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
        name="week_day_enum",
    )

    # ── exercises ──────────────────────────────────────────────────
    op.create_table(
        "exercises",
        sa.Column("id", UUID(), nullable=False),
        sa.Column("user_id", UUID(), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("category", exercise_category_enum, nullable=False),
        sa.Column("primary_muscle", muscle_group_enum, nullable=False),
        sa.Column("secondary_muscles", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("equipment", exercise_equipment_enum, nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("instructions", sa.Text(), nullable=True),
        sa.Column("is_compound", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index(op.f("ix_exercises_name"), "exercises", ["name"], unique=False)
    op.create_index(op.f("ix_exercises_user_id"), "exercises", ["user_id"], unique=False)

    # ── workout_routines ──────────────────────────────────────────
    op.create_table(
        "workout_routines",
        sa.Column("id", UUID(), nullable=False),
        sa.Column("user_id", UUID(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("estimated_duration_minutes", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index(op.f("ix_workout_routines_user_id"), "workout_routines", ["user_id"], unique=False)

    # ── workout_routine_exercises ─────────────────────────────────
    op.create_table(
        "workout_routine_exercises",
        sa.Column("id", UUID(), nullable=False),
        sa.Column("routine_id", UUID(), nullable=False),
        sa.Column("exercise_id", UUID(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("target_sets", sa.Integer(), nullable=True),
        sa.Column("target_reps", sa.Integer(), nullable=True),
        sa.Column("target_weight", sa.Float(), nullable=True),
        sa.Column("target_duration_seconds", sa.Integer(), nullable=True),
        sa.Column("rest_seconds", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["routine_id"], ["workout_routines.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["exercise_id"], ["exercises.id"], ondelete="CASCADE"),
    )
    op.create_index(op.f("ix_workout_routine_exercises_routine_id"), "workout_routine_exercises", ["routine_id"], unique=False)

    # ── exercise_regimes ──────────────────────────────────────────
    op.create_table(
        "exercise_regimes",
        sa.Column("id", UUID(), nullable=False),
        sa.Column("user_id", UUID(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index(op.f("ix_exercise_regimes_user_id"), "exercise_regimes", ["user_id"], unique=False)

    # ── exercise_regime_entries ────────────────────────────────────
    op.create_table(
        "exercise_regime_entries",
        sa.Column("id", UUID(), nullable=False),
        sa.Column("regime_id", UUID(), nullable=False),
        sa.Column("routine_id", UUID(), nullable=False),
        sa.Column("day_of_week", week_day_enum, nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["regime_id"], ["exercise_regimes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["routine_id"], ["workout_routines.id"], ondelete="CASCADE"),
    )
    op.create_index(op.f("ix_exercise_regime_entries_regime_id"), "exercise_regime_entries", ["regime_id"], unique=False)

    # ── workout_sessions ──────────────────────────────────────────
    op.create_table(
        "workout_sessions",
        sa.Column("id", UUID(), nullable=False),
        sa.Column("user_id", UUID(), nullable=False),
        sa.Column("routine_id", UUID(), nullable=True),
        sa.Column("regime_id", UUID(), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_minutes", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("location_name", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["routine_id"], ["workout_routines.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["regime_id"], ["exercise_regimes.id"], ondelete="SET NULL"),
    )
    op.create_index(op.f("ix_workout_sessions_user_id"), "workout_sessions", ["user_id"], unique=False)

    # ── workout_session_exercises ─────────────────────────────────
    op.create_table(
        "workout_session_exercises",
        sa.Column("id", UUID(), nullable=False),
        sa.Column("session_id", UUID(), nullable=False),
        sa.Column("exercise_id", UUID(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["session_id"], ["workout_sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["exercise_id"], ["exercises.id"], ondelete="CASCADE"),
    )
    op.create_index(op.f("ix_workout_session_exercises_session_id"), "workout_session_exercises", ["session_id"], unique=False)

    # ── workout_sets ──────────────────────────────────────────────
    op.create_table(
        "workout_sets",
        sa.Column("id", UUID(), nullable=False),
        sa.Column("session_exercise_id", UUID(), nullable=False),
        sa.Column("set_number", sa.Integer(), nullable=False),
        sa.Column("reps", sa.Integer(), nullable=True),
        sa.Column("weight", sa.Float(), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("rpe", sa.Float(), nullable=True),
        sa.Column("is_warmup", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_dropset", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("notes", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["session_exercise_id"], ["workout_session_exercises.id"], ondelete="CASCADE"),
    )
    op.create_index(op.f("ix_workout_sets_session_exercise_id"), "workout_sets", ["session_exercise_id"], unique=False)

    # ── gym_locations ─────────────────────────────────────────────
    op.create_table(
        "gym_locations",
        sa.Column("id", UUID(), nullable=False),
        sa.Column("user_id", UUID(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("radius_meters", sa.Integer(), nullable=False, server_default=sa.text("100")),
        sa.Column("default_routine_id", UUID(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["default_routine_id"], ["workout_routines.id"], ondelete="SET NULL"),
    )
    op.create_index(op.f("ix_gym_locations_user_id"), "gym_locations", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_table("gym_locations")
    op.drop_table("workout_sets")
    op.drop_table("workout_session_exercises")
    op.drop_table("workout_sessions")
    op.drop_table("exercise_regime_entries")
    op.drop_table("exercise_regimes")
    op.drop_table("workout_routine_exercises")
    op.drop_table("workout_routines")
    op.drop_table("exercises")

    op.execute("DROP TYPE IF EXISTS exercise_category_enum")
    op.execute("DROP TYPE IF EXISTS muscle_group_enum")
    op.execute("DROP TYPE IF EXISTS exercise_equipment_enum")
    op.execute("DROP TYPE IF EXISTS week_day_enum")
