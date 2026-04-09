import re
from collections.abc import Iterable
from datetime import date, datetime, time, timezone
from typing import TypeAlias

from sqlalchemy import select

from app.database import async_session_factory
from app.models.adherence import AdherenceLog
from app.models.enums import Frequency, TakeWindow, WeekDay
from app.models.exercise_regime import ExerciseRegime
from app.models.nutrition_cycle import NutritionCycle
from app.models.user import User
from app.models.user_medication import UserMedication
from app.models.user_supplement import UserSupplement
from app.models.user_therapy import UserTherapy
from app.models.workout_session import WorkoutSession
from app.services.nutrition_cycles import nutrition_cycle_alert, serialize_active_nutrition_phase
from app.services.regimen_schedule import (
    adherence_day_bounds,
    load_regimen_schedule_context,
    resolve_user_date,
    scheduled_regimen_items_for_date,
)
from app.services.weather import build_skincare_guidance

WINDOW_ORDER = [
    TakeWindow.morning_fasted,
    TakeWindow.morning_with_food,
    TakeWindow.midday,
    TakeWindow.afternoon,
    TakeWindow.evening,
    TakeWindow.bedtime,
]

WINDOW_LABELS = {
    TakeWindow.morning_fasted: "Morning - Fasted",
    TakeWindow.morning_with_food: "Morning - With Food",
    TakeWindow.midday: "Midday",
    TakeWindow.afternoon: "Afternoon",
    TakeWindow.evening: "Evening",
    TakeWindow.bedtime: "Bedtime",
}

SEVERITY_ORDER = {
    "critical": 4,
    "major": 3,
    "moderate": 2,
    "minor": 1,
}

InteractionItem: TypeAlias = UserSupplement | UserMedication


def _normalize_alias(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")
    return re.sub(r"_+", "_", normalized)


def _profile_aliases(name: str, ai_profile: dict | None) -> set[str]:
    aliases = {_normalize_alias(name)}
    ai_profile = ai_profile or {}
    for common_name in ai_profile.get("common_names", []):
        if isinstance(common_name, str):
            aliases.add(_normalize_alias(common_name))
    return {alias for alias in aliases if alias}


def _interaction_name(item: InteractionItem) -> str:
    if isinstance(item, UserSupplement):
        return item.supplement.name
    return item.medication.name


def _interaction_profile(item: InteractionItem) -> dict:
    if isinstance(item, UserSupplement):
        return item.supplement.ai_profile or {}
    return item.medication.ai_profile or {}


def _interaction_aliases(item: InteractionItem) -> set[str]:
    return _profile_aliases(_interaction_name(item), _interaction_profile(item))


def _frequency_instruction(frequency: Frequency) -> str:
    return {
        Frequency.daily: "Once daily",
        Frequency.twice_daily: "Twice daily",
        Frequency.three_times_daily: "Three times daily",
        Frequency.weekly: "Weekly",
        Frequency.every_other_day: "Every other day",
        Frequency.as_needed: "As needed",
    }[frequency]


def _supplement_instructions(user_supplement: UserSupplement) -> str:
    instructions = [_frequency_instruction(user_supplement.frequency)]

    if user_supplement.with_food:
        instructions.append("Take with food")
    elif user_supplement.take_window == TakeWindow.morning_fasted:
        instructions.append("Take fasted")

    if user_supplement.notes:
        instructions.append(user_supplement.notes)

    return ". ".join(instructions)


def _medication_instructions(user_medication: UserMedication) -> str:
    instructions = [_frequency_instruction(user_medication.frequency)]

    if user_medication.with_food:
        instructions.append("Take with food")
    elif user_medication.take_window == TakeWindow.morning_fasted:
        instructions.append("Take fasted")

    if user_medication.notes:
        instructions.append(user_medication.notes)

    return ". ".join(instructions)


def _therapy_instructions(user_therapy: UserTherapy) -> str:
    instructions = [_frequency_instruction(user_therapy.frequency)]

    if user_therapy.notes:
        instructions.append(user_therapy.notes)

    return ". ".join(instructions)


def _therapy_details(user_therapy: UserTherapy) -> str | None:
    details: list[str] = []
    if user_therapy.duration_minutes:
        details.append(f"{user_therapy.duration_minutes} min")

    settings = user_therapy.settings or {}
    session_details = settings.get("session_details") if isinstance(settings, dict) else None
    if isinstance(session_details, str) and session_details.strip():
        details.append(session_details.strip())

    if not details:
        return None
    return " · ".join(details)


def adherence_status_for_logs(logs: Iterable[AdherenceLog]) -> str:
    has_taken = False
    has_skipped = False

    for log in logs:
        if log.taken_at is not None:
            has_taken = True
        if log.skipped:
            has_skipped = True

    if has_taken:
        return "taken"
    if has_skipped:
        return "skipped"
    return "pending"


async def _adherence_index(user: User, target_date: date, user_tz) -> dict[tuple[str, str], list[AdherenceLog]]:
    day_start_utc, day_end_utc = adherence_day_bounds(target_date, user_tz)

    async with async_session_factory() as session:
        result = await session.execute(
            select(AdherenceLog).where(
                AdherenceLog.user_id == user.id,
                AdherenceLog.scheduled_at >= day_start_utc,
                AdherenceLog.scheduled_at < day_end_utc,
            )
        )
        logs = list(result.scalars().all())

    indexed: dict[tuple[str, str], list[AdherenceLog]] = {}
    for log in logs:
        indexed.setdefault((log.item_type, str(log.item_id)), []).append(log)
    return indexed


def _interaction_warnings(due_items: list[InteractionItem]) -> list[dict]:
    alias_sets = {str(item.id): _interaction_aliases(item) for item in due_items}
    warnings_by_pair: dict[tuple[str, str], dict] = {}

    for item in due_items:
        ai_profile = _interaction_profile(item)
        for interaction in ai_profile.get("known_interactions", []):
            if not isinstance(interaction, dict):
                continue

            substance = interaction.get("substance")
            if not isinstance(substance, str):
                continue

            normalized_substance = _normalize_alias(substance)
            matched = next(
                (
                    other
                    for other in due_items
                    if other.id != item.id and normalized_substance in alias_sets[str(other.id)]
                ),
                None,
            )
            if matched is None:
                continue

            pair_key = tuple(sorted([str(item.id), str(matched.id)]))
            warning = {
                "item_a": _interaction_name(item),
                "item_b": _interaction_name(matched),
                "type": interaction.get("type", "caution"),
                "severity": interaction.get("severity", "minor"),
                "description": interaction.get("description", ""),
            }
            existing = warnings_by_pair.get(pair_key)
            if existing is None or SEVERITY_ORDER.get(warning["severity"], 0) > SEVERITY_ORDER.get(
                existing["severity"], 0
            ):
                warnings_by_pair[pair_key] = warning

    return sorted(warnings_by_pair.values(), key=lambda warning: SEVERITY_ORDER.get(warning["severity"], 0), reverse=True)


_WEEKDAY_MAP = {
    0: WeekDay.monday,
    1: WeekDay.tuesday,
    2: WeekDay.wednesday,
    3: WeekDay.thursday,
    4: WeekDay.friday,
    5: WeekDay.saturday,
    6: WeekDay.sunday,
}


async def _build_exercise_plan(user: User, target_date: date) -> list[dict]:
    """Return today's scheduled workouts from the active regime, with completion status."""
    weekday = _WEEKDAY_MAP[target_date.weekday()]

    async with async_session_factory() as session:
        result = await session.execute(
            select(ExerciseRegime).where(
                ExerciseRegime.user_id == user.id,
                ExerciseRegime.is_active.is_(True),
            )
        )
        active_regime = result.scalar_one_or_none()
        if not active_regime:
            return []

        # Find today's entries
        today_entries = [e for e in active_regime.schedule_entries if e.day_of_week == weekday]
        if not today_entries:
            return []

        # Check if a session was already logged today for each routine
        day_start = datetime.combine(target_date, time.min, tzinfo=timezone.utc)
        day_end = datetime.combine(target_date, time.max, tzinfo=timezone.utc)

        sessions_result = await session.execute(
            select(WorkoutSession).where(
                WorkoutSession.user_id == user.id,
                WorkoutSession.started_at >= day_start,
                WorkoutSession.started_at <= day_end,
            )
        )
        todays_sessions = sessions_result.scalars().all()
        completed_routine_ids = {
            str(s.routine_id) for s in todays_sessions if s.routine_id and s.completed_at
        }
        started_routine_ids = {
            str(s.routine_id) for s in todays_sessions if s.routine_id
        }

        plan_items = []
        for entry in today_entries:
            routine = entry.routine
            routine_id_str = str(routine.id)
            if routine_id_str in completed_routine_ids:
                status = "completed"
            elif routine_id_str in started_routine_ids:
                status = "in_progress"
            else:
                status = "pending"

            plan_items.append({
                "routine_id": routine_id_str,
                "routine_name": routine.name,
                "exercise_count": len(routine.exercises),
                "estimated_duration_minutes": routine.estimated_duration_minutes,
                "regime_name": active_regime.name,
                "status": status,
            })

        return plan_items


async def build_daily_plan(user: User, target_date: date | None = None) -> dict:
    resolved_date, user_tz = resolve_user_date(target_date, user.timezone)
    schedule_context = await load_regimen_schedule_context(user)

    async with async_session_factory() as session:
        nutrition_result = await session.execute(
            select(NutritionCycle)
            .where(
                NutritionCycle.user_id == user.id,
                NutritionCycle.is_active.is_(True),
            )
            .order_by(NutritionCycle.created_at.desc())
        )
        active_nutrition_cycle = nutrition_result.scalars().first()

    scheduled_items = scheduled_regimen_items_for_date(schedule_context, resolved_date)
    due_supplements = [item.item for item in scheduled_items if item.item_type == "supplement"]
    due_medications = [item.item for item in scheduled_items if item.item_type == "medication"]
    due_therapies = [item.item for item in scheduled_items if item.item_type == "therapy"]
    due_peptides = [item.item for item in scheduled_items if item.item_type == "peptide"]
    active_regimes_by_item = {
        (item.item_type, str(item.item.id)): item.active_protocol_names for item in scheduled_items
    }
    adherence_index = await _adherence_index(user, resolved_date, user_tz)
    active_nutrition_phase = (
        serialize_active_nutrition_phase(active_nutrition_cycle, resolved_date) if active_nutrition_cycle else None
    )
    active_nutrition_alert = (
        nutrition_cycle_alert(active_nutrition_cycle, resolved_date) if active_nutrition_cycle else None
    )
    skincare_guidance = await build_skincare_guidance(user)

    windows = []
    for window in WINDOW_ORDER:
        items = []
        for item in due_supplements:
            if item.take_window != window:
                continue

            items.append(
                {
                    "id": str(item.id),
                    "name": item.supplement.name,
                    "type": "supplement",
                    "details": f"{item.dosage_amount:g} {item.dosage_unit}",
                    "instructions": _supplement_instructions(item),
                    "regimes": active_regimes_by_item.get(("supplement", str(item.id)), []),
                    "is_on_cycle": True,
                    "adherence_status": adherence_status_for_logs(
                        adherence_index.get(("supplement", str(item.id)), [])
                    ),
                }
            )
        for item in due_medications:
            if item.take_window != window:
                continue

            items.append(
                {
                    "id": str(item.id),
                    "name": item.medication.name,
                    "type": "medication",
                    "details": f"{item.dosage_amount:g} {item.dosage_unit}",
                    "instructions": _medication_instructions(item),
                    "regimes": active_regimes_by_item.get(("medication", str(item.id)), []),
                    "is_on_cycle": True,
                    "adherence_status": adherence_status_for_logs(
                        adherence_index.get(("medication", str(item.id)), [])
                    ),
                }
            )
        for item in due_therapies:
            if item.take_window != window:
                continue

            items.append(
                {
                    "id": str(item.id),
                    "name": item.therapy.name,
                    "type": "therapy",
                    "details": _therapy_details(item),
                    "instructions": _therapy_instructions(item),
                    "regimes": active_regimes_by_item.get(("therapy", str(item.id)), []),
                    "is_on_cycle": True,
                    "adherence_status": adherence_status_for_logs(
                        adherence_index.get(("therapy", str(item.id)), [])
                    ),
                }
            )
        for item in due_peptides:
            if item.take_window != window:
                continue

            route_label = f" ({item.route})" if item.route else ""
            items.append(
                {
                    "id": str(item.id),
                    "name": item.peptide.name,
                    "type": "peptide",
                    "details": f"{item.dosage_amount:g} {item.dosage_unit}{route_label}",
                    "instructions": item.notes or "",
                    "regimes": active_regimes_by_item.get(("peptide", str(item.id)), []),
                    "is_on_cycle": True,
                    "adherence_status": adherence_status_for_logs(
                        adherence_index.get(("peptide", str(item.id)), [])
                    ),
                }
            )

        windows.append(
            {
                "window": window,
                "display_time": WINDOW_LABELS[window],
                "items": items,
            }
        )

    # ─── Exercise: today's routine from active regime ────────────
    exercise_plan = await _build_exercise_plan(user, resolved_date)

    return {
        "date": resolved_date.isoformat(),
        "windows": windows,
        "exercise_plan": exercise_plan,
        "nutrition_phase": active_nutrition_phase,
        "skincare_guidance": skincare_guidance,
        "cycle_alerts": [active_nutrition_alert] if active_nutrition_alert else [],
        "interactions": _interaction_warnings([*due_supplements, *due_medications]),
    }
