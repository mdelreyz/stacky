from datetime import date, timedelta

from sqlalchemy import select

from app.database import async_session_factory
from app.models.adherence import AdherenceLog
from app.models.user import User
from app.models.user_medication import UserMedication
from app.models.user_supplement import UserSupplement
from app.models.user_therapy import UserTherapy
from app.services.daily_plan import adherence_status_for_logs
from app.services.regimen_schedule import (
    adherence_day_bounds,
    load_regimen_schedule_context,
    resolve_user_date,
    scheduled_regimen_items_for_date,
)


def _item_name(item: UserSupplement | UserMedication | UserTherapy) -> str:
    if isinstance(item, UserSupplement):
        return item.supplement.name
    if isinstance(item, UserMedication):
        return item.medication.name
    return item.therapy.name


def _log_status(log: AdherenceLog) -> str:
    return "taken" if log.taken_at is not None else "skipped"


def _build_item_suggestion(stat: dict) -> dict | None:
    if stat["scheduled_count"] < 3:
        return None

    if stat["pending_count"] >= 3 and stat["completion_rate"] < 0.6:
        return {
            "item_id": stat["item_id"],
            "item_name": stat["item_name"],
            "item_type": stat["item_type"],
            "headline": f"{stat['item_name']} is often left pending",
            "recommendation": f"Try moving it out of {stat['take_window'].replace('_', ' ')} or isolating it in a smaller scheduled regime.",
        }

    if stat["skipped_count"] >= max(2, stat["taken_count"]):
        return {
            "item_id": stat["item_id"],
            "item_name": stat["item_name"],
            "item_type": stat["item_type"],
            "headline": f"{stat['item_name']} is frequently skipped",
            "recommendation": "Review whether the cadence is too aggressive or whether this item should stay in the active plan.",
        }

    return None


async def build_tracking_overview(user: User, *, days: int = 14, end_date: date | None = None) -> dict:
    resolved_end_date, user_tz = resolve_user_date(end_date, user.timezone)
    start_date = resolved_end_date - timedelta(days=days - 1)
    schedule_context = await load_regimen_schedule_context(user)

    start_utc, _ = adherence_day_bounds(start_date, user_tz)
    _, end_utc = adherence_day_bounds(resolved_end_date, user_tz)

    async with async_session_factory() as session:
        result = await session.execute(
            select(AdherenceLog).where(
                AdherenceLog.user_id == user.id,
                AdherenceLog.scheduled_at >= start_utc,
                AdherenceLog.scheduled_at < end_utc,
            )
        )
        logs = list(result.scalars().all())

    logs_by_occurrence: dict[tuple[str, str, date], list[AdherenceLog]] = {}
    for log in logs:
        local_date = log.scheduled_at.astimezone(user_tz).date()
        logs_by_occurrence.setdefault((log.item_type, str(log.item_id), local_date), []).append(log)

    item_stats: dict[tuple[str, str], dict] = {}
    day_completion: dict[date, bool | None] = {}

    scheduled_count = 0
    taken_count = 0
    skipped_count = 0
    pending_count = 0

    for day_offset in range(days):
        target_day = start_date + timedelta(days=day_offset)
        scheduled_items = scheduled_regimen_items_for_date(schedule_context, target_day)
        if not scheduled_items:
            day_completion[target_day] = None
            continue

        day_completion[target_day] = True
        for scheduled_item in scheduled_items:
            item = scheduled_item.item
            item_key = (scheduled_item.item_type, str(item.id))
            stat = item_stats.setdefault(
                item_key,
                {
                    "item_id": str(item.id),
                    "item_name": _item_name(item),
                    "item_type": scheduled_item.item_type,
                    "take_window": item.take_window,
                    "regimes": scheduled_item.active_protocol_names,
                    "scheduled_count": 0,
                    "taken_count": 0,
                    "skipped_count": 0,
                    "pending_count": 0,
                    "completion_rate": 0.0,
                    "last_taken_at": None,
                },
            )

            scheduled_count += 1
            stat["scheduled_count"] += 1
            logs_for_item = logs_by_occurrence.get((scheduled_item.item_type, str(item.id), target_day), [])
            status = adherence_status_for_logs(logs_for_item)

            if status == "taken":
                taken_count += 1
                stat["taken_count"] += 1
                latest_taken = max(log.taken_at for log in logs_for_item if log.taken_at is not None)
                if stat["last_taken_at"] is None or latest_taken > stat["last_taken_at"]:
                    stat["last_taken_at"] = latest_taken
            elif status == "skipped":
                skipped_count += 1
                stat["skipped_count"] += 1
                day_completion[target_day] = False
            else:
                pending_count += 1
                stat["pending_count"] += 1
                day_completion[target_day] = False

    for stat in item_stats.values():
        stat["completion_rate"] = round(stat["taken_count"] / stat["scheduled_count"], 3) if stat["scheduled_count"] else 0.0

    current_streak_days = 0
    for day_offset in range(days):
        target_day = resolved_end_date - timedelta(days=day_offset)
        status = day_completion.get(target_day)
        if status is None:
            continue
        if status is False:
            break
        current_streak_days += 1

    sorted_stats = sorted(
        item_stats.values(),
        key=lambda stat: (stat["completion_rate"], -stat["scheduled_count"], stat["item_name"].lower()),
    )

    suggestions = []
    if scheduled_count >= 7 and taken_count / scheduled_count < 0.65:
        suggestions.append(
            {
                "item_id": None,
                "item_name": None,
                "item_type": "overall",
                "headline": "Your plan looks dense",
                "recommendation": "Completion has been low across the active plan. Consider splitting items into alternate or vacation regimes instead of keeping everything active at once.",
            }
        )
    for stat in sorted_stats:
        suggestion = _build_item_suggestion(stat)
        if suggestion is not None:
            suggestions.append(suggestion)
        if len(suggestions) >= 4:
            break

    item_lookup = {(item_type, item_id): stat for (item_type, item_id), stat in item_stats.items()}
    recent_events = []
    for log in sorted(logs, key=lambda item: item.taken_at or item.scheduled_at, reverse=True)[:15]:
        key = (log.item_type, str(log.item_id))
        stat = item_lookup.get(key)
        recent_events.append(
            {
                "item_id": str(log.item_id),
                "item_name": stat["item_name"] if stat else "Tracked item",
                "item_type": log.item_type,
                "status": _log_status(log),
                "scheduled_at": log.scheduled_at,
                "taken_at": log.taken_at,
                "skip_reason": log.skip_reason,
                "regimes": stat["regimes"] if stat else [],
            }
        )

    completion_rate = round(taken_count / scheduled_count, 3) if scheduled_count else 0.0

    return {
        "window_days": days,
        "start_date": start_date,
        "end_date": resolved_end_date,
        "scheduled_count": scheduled_count,
        "taken_count": taken_count,
        "skipped_count": skipped_count,
        "pending_count": pending_count,
        "completion_rate": completion_rate,
        "current_streak_days": current_streak_days,
        "item_stats": sorted_stats,
        "recent_events": recent_events,
        "suggestions": suggestions,
    }
