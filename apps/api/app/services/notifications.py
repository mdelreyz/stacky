"""Notification and reminder services — computes reminder schedules from daily plan + user preferences."""

from __future__ import annotations

import logging
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import TakeWindow
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
