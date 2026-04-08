import re
from collections.abc import Iterable
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import async_session_factory
from app.models.adherence import AdherenceLog
from app.models.user import User
from app.models.user_supplement import Frequency, TakeWindow, UserSupplement

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


def resolve_user_date(target_date: date | None, timezone_name: str | None) -> tuple[date, ZoneInfo]:
    try:
        user_tz = ZoneInfo(timezone_name or "UTC")
    except ZoneInfoNotFoundError:
        user_tz = ZoneInfo("UTC")

    if target_date is not None:
        return target_date, user_tz

    return datetime.now(user_tz).date(), user_tz


def _normalize_alias(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")
    return re.sub(r"_+", "_", normalized)


def _supplement_aliases(user_supplement: UserSupplement) -> set[str]:
    aliases = {_normalize_alias(user_supplement.supplement.name)}
    ai_profile = user_supplement.supplement.ai_profile or {}
    for common_name in ai_profile.get("common_names", []):
        if isinstance(common_name, str):
            aliases.add(_normalize_alias(common_name))
    return {alias for alias in aliases if alias}


def _is_due_today(user_supplement: UserSupplement, target_date: date) -> bool:
    if user_supplement.started_at > target_date:
        return False
    if user_supplement.ended_at and user_supplement.ended_at < target_date:
        return False

    days_since_start = (target_date - user_supplement.started_at).days
    frequency = user_supplement.frequency

    if frequency in {Frequency.daily, Frequency.twice_daily, Frequency.three_times_daily}:
        return True
    if frequency == Frequency.every_other_day:
        return days_since_start % 2 == 0
    if frequency == Frequency.weekly:
        return days_since_start % 7 == 0
    if frequency == Frequency.as_needed:
        return False
    return False


def _frequency_instruction(frequency: Frequency) -> str:
    return {
        Frequency.daily: "Once daily",
        Frequency.twice_daily: "Twice daily",
        Frequency.three_times_daily: "Three times daily",
        Frequency.weekly: "Weekly",
        Frequency.every_other_day: "Every other day",
        Frequency.as_needed: "As needed",
    }[frequency]


def _item_instructions(user_supplement: UserSupplement) -> str:
    instructions = [_frequency_instruction(user_supplement.frequency)]

    if user_supplement.with_food:
        instructions.append("Take with food")
    elif user_supplement.take_window == TakeWindow.morning_fasted:
        instructions.append("Take fasted")

    if user_supplement.notes:
        instructions.append(user_supplement.notes)

    return ". ".join(instructions)


def _adherence_status_for_logs(logs: Iterable[AdherenceLog]) -> str:
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


async def _adherence_index(user: User, target_date: date, user_tz: ZoneInfo) -> dict[tuple[str, str], list[AdherenceLog]]:
    day_start_local = datetime.combine(target_date, time.min, tzinfo=user_tz)
    day_end_local = day_start_local + timedelta(days=1)
    day_start_utc = day_start_local.astimezone(timezone.utc)
    day_end_utc = day_end_local.astimezone(timezone.utc)

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


def _interaction_warnings(due_items: list[UserSupplement]) -> list[dict]:
    alias_sets = {str(item.id): _supplement_aliases(item) for item in due_items}
    warnings_by_pair: dict[tuple[str, str], dict] = {}

    for item in due_items:
        ai_profile = item.supplement.ai_profile or {}
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
                "supplement_a": item.supplement.name,
                "supplement_b": matched.supplement.name,
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


async def build_daily_plan(user: User, target_date: date | None = None) -> dict:
    resolved_date, user_tz = resolve_user_date(target_date, user.timezone)

    async with async_session_factory() as session:
        result = await session.execute(
            select(UserSupplement)
            .options(selectinload(UserSupplement.supplement))
            .where(
                UserSupplement.user_id == user.id,
                UserSupplement.is_active.is_(True),
            )
            .order_by(UserSupplement.take_window, UserSupplement.created_at)
        )
        user_supplements = list(result.scalars().all())

    due_today = [item for item in user_supplements if _is_due_today(item, resolved_date)]
    adherence_index = await _adherence_index(user, resolved_date, user_tz)

    windows = []
    for window in WINDOW_ORDER:
        items = []
        for item in due_today:
            if item.take_window != window:
                continue

            items.append(
                {
                    "id": str(item.id),
                    "name": item.supplement.name,
                    "type": "supplement",
                    "dosage": f"{item.dosage_amount:g} {item.dosage_unit}",
                    "instructions": _item_instructions(item),
                    "is_on_cycle": True,
                    "adherence_status": _adherence_status_for_logs(
                        adherence_index.get(("supplement", str(item.id)), [])
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

    return {
        "date": resolved_date.isoformat(),
        "windows": windows,
        "nutrition_phase": None,
        "cycle_alerts": [],
        "interactions": _interaction_warnings(due_today),
    }
