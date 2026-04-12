from datetime import date

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models.notification_preferences import PushToken
from app.models.user import User
from app.schemas.notification import (
    NotificationDeliveryResponse,
    NotificationPreferencesResponse,
    NotificationPreferencesUpdate,
    PushTokenCreate,
    PushTokenResponse,
    ReminderScheduleResponse,
)
from app.services.notifications import (
    compute_reminder_schedule,
    deactivate_push_token,
    get_or_create_notification_preferences,
    register_push_token,
    send_test_push_notification,
    update_notification_preferences,
)

router = APIRouter(prefix="/users/me/notifications", tags=["notifications"])


# ─── Notification Preferences ────────────────────────────────────


@router.get("/preferences", response_model=NotificationPreferencesResponse)
async def get_notification_preferences(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    prefs = await get_or_create_notification_preferences(session, current_user.id)
    return NotificationPreferencesResponse.model_validate(prefs)


@router.put("/preferences", response_model=NotificationPreferencesResponse)
async def update_notification_prefs(
    body: NotificationPreferencesUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    updates = body.model_dump(exclude_unset=True)
    prefs = await update_notification_preferences(session, current_user.id, updates)
    return NotificationPreferencesResponse.model_validate(prefs)


# ─── Push Tokens ─────────────────────────────────────────────────


@router.get("/push-tokens", response_model=list[PushTokenResponse])
async def list_push_tokens(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(
        select(PushToken).where(
            PushToken.user_id == current_user.id,
            PushToken.is_active.is_(True),
        )
    )
    return [PushTokenResponse.model_validate(t) for t in result.scalars().all()]


@router.post("/push-tokens", response_model=PushTokenResponse, status_code=201)
async def register_token(
    body: PushTokenCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    token = await register_push_token(
        session,
        current_user.id,
        body.token,
        device_id=body.device_id,
        platform=body.platform,
    )
    return PushTokenResponse.model_validate(token)


@router.delete("/push-tokens/{token}", status_code=204)
async def remove_push_token(
    token: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    removed = await deactivate_push_token(session, current_user.id, token)
    if not removed:
        raise HTTPException(status_code=404, detail="Push token not found")


# ─── Reminder Schedule ───────────────────────────────────────────


@router.get("/reminders", response_model=ReminderScheduleResponse)
async def get_reminder_schedule(
    target_date: date | None = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if target_date is None:
        target_date = date.today()
    schedule = await compute_reminder_schedule(session, current_user, target_date)
    return ReminderScheduleResponse(**schedule)


@router.post("/test-push", response_model=NotificationDeliveryResponse)
async def send_notification_test_push(
    target_date: date | None = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if target_date is None:
        target_date = date.today()

    try:
        result = await send_test_push_notification(session, current_user, target_date)
    except (httpx.HTTPError, RuntimeError) as exc:
        raise HTTPException(status_code=502, detail="Failed to send push notification via Expo") from exc

    return NotificationDeliveryResponse(**result)
