"""Notification and reminder services — computes reminder schedules from daily plan + user preferences."""

from __future__ import annotations

import asyncio
import logging
from datetime import date, datetime, time, timezone
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import async_session_factory
from app.models.enums import TakeWindow
from app.models.notification_delivery import NotificationDelivery
from app.models.notification_preferences import NotificationPreferences, PushToken
from app.models.user import User
from app.services.daily_plan import build_daily_plan

logger = logging.getLogger(__name__)

# Default reminder times for each take window
DEFAULT_WINDOW_TIMES: dict[str, str] = {
    TakeWindow.morning_fasted.value: "06:30",
    TakeWindow.morning_with_food.value: "07:30",
    TakeWindow.midday.value: "12:00",
    TakeWindow.afternoon.value: "15:00",
    TakeWindow.evening.value: "18:30",
    TakeWindow.bedtime.value: "21:30",
}

EXPO_PUSH_HEADERS = {
    "accept": "application/json",
    "accept-encoding": "gzip, deflate",
    "content-type": "application/json",
}

SCHEDULED_REMINDER_TYPE = "scheduled_reminder"


async def get_or_create_notification_preferences(
    session: AsyncSession,
    user_id,
) -> NotificationPreferences:
    """Get existing notification preferences or create defaults."""
    result = await session.execute(
        select(NotificationPreferences).where(NotificationPreferences.user_id == user_id)
    )
    prefs = result.scalar_one_or_none()
    if prefs is not None:
        return prefs

    prefs = NotificationPreferences(
        user_id=user_id,
        enabled=True,
        window_times=dict(DEFAULT_WINDOW_TIMES),
        enabled_windows=list(DEFAULT_WINDOW_TIMES.keys()),
    )
    session.add(prefs)
    await session.commit()
    await session.refresh(prefs)
    return prefs


async def update_notification_preferences(
    session: AsyncSession,
    user_id,
    updates: dict,
) -> NotificationPreferences:
    """Update notification preferences with partial data."""
    prefs = await get_or_create_notification_preferences(session, user_id)
    for field, value in updates.items():
        if hasattr(prefs, field):
            setattr(prefs, field, value)
    await session.commit()
    await session.refresh(prefs)
    return prefs


async def register_push_token(
    session: AsyncSession,
    user_id,
    token: str,
    device_id: str | None = None,
    platform: str | None = None,
) -> PushToken:
    """Register or update an Expo push token for a user's device."""
    # Check if token already exists for this user
    existing_query = select(PushToken).where(
        PushToken.user_id == user_id,
        PushToken.token == token,
    )
    result = await session.execute(existing_query)
    existing = result.scalar_one_or_none()

    if existing:
        existing.is_active = True
        existing.device_id = device_id or existing.device_id
        existing.platform = platform or existing.platform
        await session.commit()
        await session.refresh(existing)
        return existing

    # If device_id provided, deactivate old token for that device
    if device_id:
        old_result = await session.execute(
            select(PushToken).where(
                PushToken.user_id == user_id,
                PushToken.device_id == device_id,
                PushToken.is_active.is_(True),
            )
        )
        for old_token in old_result.scalars().all():
            old_token.is_active = False

    push_token = PushToken(
        user_id=user_id,
        token=token,
        device_id=device_id,
        platform=platform,
    )
    session.add(push_token)
    await session.commit()
    await session.refresh(push_token)
    return push_token


async def deactivate_push_token(
    session: AsyncSession,
    user_id,
    token: str,
) -> bool:
    """Deactivate a push token (e.g., on logout)."""
    result = await session.execute(
        select(PushToken).where(
            PushToken.user_id == user_id,
            PushToken.token == token,
            PushToken.is_active.is_(True),
        )
    )
    push_token = result.scalar_one_or_none()
    if not push_token:
        return False
    push_token.is_active = False
    await session.commit()
    return True


async def compute_reminder_schedule(
    session: AsyncSession,
    user: User,
    target_date: date,
) -> dict:
    """Compute the reminder schedule for a given date based on daily plan and notification preferences."""
    prefs = await get_or_create_notification_preferences(session, user.id)

    if not prefs.enabled:
        return {
            "date": target_date.isoformat(),
            "reminders": [],
            "quiet_start": prefs.quiet_start,
            "quiet_end": prefs.quiet_end,
        }

    # Build the daily plan to know what's scheduled
    plan = await build_daily_plan(user, target_date)
    window_times = prefs.window_times or DEFAULT_WINDOW_TIMES
    enabled_windows = set(prefs.enabled_windows or DEFAULT_WINDOW_TIMES.keys())

    reminders = []
    for window_plan in plan.get("windows", []):
        window_name = window_plan.get("window", "")
        if window_name not in enabled_windows:
            continue

        items = window_plan.get("items", [])
        pending_items = [i for i in items if i.get("status") == "pending"]
        if not pending_items:
            continue

        scheduled_time = window_times.get(window_name, DEFAULT_WINDOW_TIMES.get(window_name, "08:00"))

        reminders.append({
            "window": window_name,
            "scheduled_time": scheduled_time,
            "items_count": len(pending_items),
            "item_names": [i.get("name", "") for i in pending_items],
        })

    # Sort by scheduled time
    reminders.sort(key=lambda r: r["scheduled_time"])

    return {
        "date": target_date.isoformat(),
        "reminders": reminders,
        "quiet_start": prefs.quiet_start,
        "quiet_end": prefs.quiet_end,
    }


async def get_active_push_tokens(
    session: AsyncSession,
    user_id,
) -> list[PushToken]:
    """Get all active push tokens for a user."""
    result = await session.execute(
        select(PushToken).where(
            PushToken.user_id == user_id,
            PushToken.is_active.is_(True),
        )
    )
    return list(result.scalars().all())


def _resolve_user_timezone(timezone_name: str | None) -> ZoneInfo:
    try:
        return ZoneInfo(timezone_name or "UTC")
    except ZoneInfoNotFoundError:
        return ZoneInfo("UTC")


def _parse_hhmm(value: str | None) -> time | None:
    if not value:
        return None

    try:
        hour_str, minute_str = value.split(":", 1)
        hour = int(hour_str)
        minute = int(minute_str)
    except (TypeError, ValueError):
        return None

    if not (0 <= hour <= 23 and 0 <= minute <= 59):
        return None
    return time(hour, minute)


def _time_to_minutes(value: time) -> int:
    return value.hour * 60 + value.minute


def _is_within_quiet_hours(current_time: time, quiet_start: str | None, quiet_end: str | None) -> bool:
    start = _parse_hhmm(quiet_start)
    end = _parse_hhmm(quiet_end)
    if start is None or end is None:
        return False

    start_minutes = _time_to_minutes(start)
    end_minutes = _time_to_minutes(end)
    current_minutes = _time_to_minutes(current_time)

    if start_minutes == end_minutes:
        return False
    if start_minutes < end_minutes:
        return start_minutes <= current_minutes < end_minutes
    return current_minutes >= start_minutes or current_minutes < end_minutes


async def _delivered_windows_for_date(
    session: AsyncSession,
    user_id,
    target_date: date,
) -> set[str]:
    result = await session.execute(
        select(NotificationDelivery.window).where(
            NotificationDelivery.user_id == user_id,
            NotificationDelivery.notification_type == SCHEDULED_REMINDER_TYPE,
            NotificationDelivery.target_date == target_date,
        )
    )
    return set(result.scalars().all())


def _due_reminders_for_dispatch(
    reminders: list[dict[str, Any]],
    *,
    current_local_dt: datetime,
    advance_minutes: int,
    lookback_minutes: int,
    delivered_windows: set[str],
) -> list[dict[str, Any]]:
    current_minutes = _time_to_minutes(current_local_dt.timetz().replace(tzinfo=None))
    due_reminders: list[dict[str, Any]] = []

    for reminder in reminders:
        window = reminder.get("window")
        if not isinstance(window, str) or window in delivered_windows:
            continue

        scheduled_time = _parse_hhmm(reminder.get("scheduled_time"))
        if scheduled_time is None:
            continue

        trigger_minutes = _time_to_minutes(scheduled_time) - max(advance_minutes, 0)
        if trigger_minutes < 0:
            continue

        if current_minutes - lookback_minutes <= trigger_minutes <= current_minutes:
            due_reminders.append(reminder)

    return due_reminders


def _format_window_label(window: str) -> str:
    return window.replace("_", " ").title()


def _build_test_push_preview(target_date: date, reminders: list[dict[str, Any]]) -> tuple[str, str]:
    if not reminders:
        return (
            "Protocol reminder test",
            f"No reminders are due on {target_date.isoformat()}, but push delivery is configured.",
        )

    if len(reminders) == 1:
        reminder = reminders[0]
        visible_names = [name for name in reminder.get("item_names", []) if name][:2]
        extra_count = max(reminder.get("items_count", 0) - len(visible_names), 0)
        names_text = ", ".join(visible_names) if visible_names else f"{reminder.get('items_count', 0)} items"
        if extra_count:
            names_text = f"{names_text} +{extra_count} more"
        return (
            "Protocol reminder test",
            f"{_format_window_label(reminder.get('window', 'today'))}: {names_text}",
        )

    segments = []
    for reminder in reminders[:3]:
        item_count = reminder.get("items_count", 0)
        suffix = "" if item_count == 1 else "s"
        segments.append(f"{_format_window_label(reminder.get('window', 'today'))}: {item_count} item{suffix}")
    if len(reminders) > 3:
        segments.append("More windows due")
    return ("Protocol reminder test", " • ".join(segments))


def _build_scheduled_push_preview(reminders: list[dict[str, Any]]) -> tuple[str, str]:
    if len(reminders) == 1:
        reminder = reminders[0]
        window_label = _format_window_label(reminder.get("window", "today"))
        visible_names = [name for name in reminder.get("item_names", []) if name][:2]
        item_count = reminder.get("items_count", 0)
        extra_count = max(item_count - len(visible_names), 0)
        names_text = ", ".join(visible_names) if visible_names else f"{item_count} item"
        if extra_count:
            names_text = f"{names_text} +{extra_count} more"
        return (f"{window_label} protocol reminder", names_text)

    total_items = sum(int(reminder.get("items_count", 0)) for reminder in reminders)
    return (
        "Protocol reminders due",
        f"{len(reminders)} windows and {total_items} items are due now.",
    )


async def _apply_ticket_results(
    session: AsyncSession,
    push_tokens: list[PushToken],
    tickets: list[dict[str, Any]],
) -> tuple[int, int]:
    sent_count = 0
    deactivated_count = 0

    for push_token, ticket in zip(push_tokens, tickets):
        if ticket.get("status") == "ok":
            sent_count += 1
            continue

        details = ticket.get("details") or {}
        if details.get("error") == "DeviceNotRegistered":
            push_token.is_active = False
            deactivated_count += 1

    if deactivated_count:
        await session.commit()

    return sent_count, deactivated_count


async def send_expo_push_messages(
    messages: list[dict[str, Any]],
    *,
    client: httpx.AsyncClient | None = None,
) -> list[dict[str, Any]]:
    if not messages:
        return []

    headers = dict(EXPO_PUSH_HEADERS)
    if settings.expo_push_access_token:
        headers["authorization"] = f"Bearer {settings.expo_push_access_token}"

    owns_client = client is None
    if client is None:
        client = httpx.AsyncClient(timeout=settings.expo_push_timeout_seconds)

    try:
        response = await client.post(settings.expo_push_api_url, json=messages, headers=headers)
        response.raise_for_status()
        payload = response.json()
    finally:
        if owns_client:
            await client.aclose()

    data = payload.get("data", [])
    if isinstance(data, dict):
        return [data]
    if isinstance(data, list):
        return data
    raise RuntimeError("Expo push service returned an unexpected payload")


async def send_test_push_notification(
    session: AsyncSession,
    user: User,
    target_date: date,
    *,
    client: httpx.AsyncClient | None = None,
) -> dict[str, Any]:
    push_tokens = await get_active_push_tokens(session, user.id)
    if not push_tokens:
        return {
            "status": "skipped",
            "target_date": target_date.isoformat(),
            "reminder_count": 0,
            "active_tokens": 0,
            "sent_count": 0,
            "title": None,
            "body": None,
            "message": "Register a push-enabled device first.",
        }

    schedule = await compute_reminder_schedule(session, user, target_date)
    reminders = schedule.get("reminders", [])
    title, body = _build_test_push_preview(target_date, reminders)
    payload_data = {
        "type": "notification_test",
        "target_date": target_date.isoformat(),
        "reminders": [
            {
                "window": reminder.get("window"),
                "scheduled_time": reminder.get("scheduled_time"),
                "items_count": reminder.get("items_count"),
            }
            for reminder in reminders
        ],
    }
    messages = [
        {
            "to": push_token.token,
            "sound": "default",
            "channelId": "default",
            "title": title,
            "body": body,
            "data": payload_data,
        }
        for push_token in push_tokens
    ]

    tickets = await send_expo_push_messages(messages, client=client)
    sent_count, deactivated_count = await _apply_ticket_results(session, push_tokens, tickets)

    if sent_count:
        message = f"Sent a test push to {sent_count} device"
        message += "" if sent_count == 1 else "s"
        message += "."
        if deactivated_count:
            message += f" Deactivated {deactivated_count} stale token"
            message += "" if deactivated_count == 1 else "s"
            message += "."
        status = "sent"
    else:
        message = "Expo rejected the registered push token"
        message += "." if len(push_tokens) == 1 else "s."
        if deactivated_count:
            message += f" Deactivated {deactivated_count} stale token"
            message += "" if deactivated_count == 1 else "s"
            message += "."
        status = "skipped"

    return {
        "status": status,
        "target_date": target_date.isoformat(),
        "reminder_count": len(reminders),
        "active_tokens": len(push_tokens),
        "sent_count": sent_count,
        "title": title,
        "body": body,
        "message": message,
    }


async def dispatch_due_reminders_batch(
    *,
    dispatch_at: datetime | None = None,
    lookback_minutes: int | None = None,
    client: httpx.AsyncClient | None = None,
) -> dict[str, Any]:
    dispatch_at = dispatch_at or datetime.now(timezone.utc)
    if dispatch_at.tzinfo is None:
        dispatch_at = dispatch_at.replace(tzinfo=timezone.utc)
    lookback_minutes = max(lookback_minutes or settings.notification_dispatch_lookback_minutes, 0)

    summary = {
        "dispatch_at": dispatch_at.astimezone(timezone.utc).isoformat(),
        "lookback_minutes": lookback_minutes,
        "users_considered": 0,
        "users_notified": 0,
        "windows_delivered": 0,
        "device_notifications_sent": 0,
    }

    async with async_session_factory() as session:
        result = await session.execute(
            select(User)
            .join(PushToken, PushToken.user_id == User.id)
            .where(
                User.deleted_at.is_(None),
                PushToken.is_active.is_(True),
            )
            .distinct()
            .order_by(User.created_at)
        )
        users = list(result.scalars().all())

        for user in users:
            summary["users_considered"] += 1

            prefs = await get_or_create_notification_preferences(session, user.id)
            if not prefs.enabled:
                continue

            user_tz = _resolve_user_timezone(user.timezone)
            current_local_dt = dispatch_at.astimezone(user_tz)
            if _is_within_quiet_hours(current_local_dt.timetz().replace(tzinfo=None), prefs.quiet_start, prefs.quiet_end):
                continue

            target_date = current_local_dt.date()
            schedule = await compute_reminder_schedule(session, user, target_date)
            delivered_windows = await _delivered_windows_for_date(session, user.id, target_date)
            due_reminders = _due_reminders_for_dispatch(
                schedule.get("reminders", []),
                current_local_dt=current_local_dt,
                advance_minutes=prefs.advance_minutes or 0,
                lookback_minutes=lookback_minutes,
                delivered_windows=delivered_windows,
            )
            if not due_reminders:
                continue

            push_tokens = await get_active_push_tokens(session, user.id)
            if not push_tokens:
                continue

            title, body = _build_scheduled_push_preview(due_reminders)
            payload_data = {
                "type": SCHEDULED_REMINDER_TYPE,
                "target_date": target_date.isoformat(),
                "windows": [reminder.get("window") for reminder in due_reminders],
            }
            messages = [
                {
                    "to": push_token.token,
                    "sound": "default",
                    "channelId": "default",
                    "title": title,
                    "body": body,
                    "data": payload_data,
                }
                for push_token in push_tokens
            ]

            tickets = await send_expo_push_messages(messages, client=client)
            sent_count, _deactivated_count = await _apply_ticket_results(session, push_tokens, tickets)
            if sent_count <= 0:
                continue

            for reminder in due_reminders:
                session.add(
                    NotificationDelivery(
                        user_id=user.id,
                        notification_type=SCHEDULED_REMINDER_TYPE,
                        target_date=target_date,
                        window=str(reminder.get("window")),
                    )
                )
            await session.commit()

            summary["users_notified"] += 1
            summary["windows_delivered"] += len(due_reminders)
            summary["device_notifications_sent"] += sent_count

    return summary


def dispatch_due_reminders_sync(
    *,
    dispatch_at_iso: str | None = None,
    lookback_minutes: int | None = None,
) -> dict[str, Any]:
    dispatch_at = None
    if dispatch_at_iso:
        dispatch_at = datetime.fromisoformat(dispatch_at_iso)
        if dispatch_at.tzinfo is None:
            dispatch_at = dispatch_at.replace(tzinfo=timezone.utc)

    return asyncio.run(dispatch_due_reminders_batch(dispatch_at=dispatch_at, lookback_minutes=lookback_minutes))
