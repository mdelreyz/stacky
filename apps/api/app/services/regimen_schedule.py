from collections import defaultdict
from collections.abc import Iterable
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, timezone
from typing import TypeAlias
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import async_session_factory
from app.models.protocol import Protocol, ProtocolItem
from app.models.user import User
from app.models.user_medication import UserMedication
from app.models.user_supplement import Frequency, TakeWindow, UserSupplement
from app.models.user_therapy import UserTherapy
from app.services.protocol_schedule import protocol_has_schedule, protocol_is_available_on_date

WINDOW_TIMES = {
    TakeWindow.morning_fasted: time(7, 0),
    TakeWindow.morning_with_food: time(8, 0),
    TakeWindow.midday: time(12, 30),
    TakeWindow.afternoon: time(15, 0),
    TakeWindow.evening: time(19, 0),
    TakeWindow.bedtime: time(22, 0),
}

ScheduleItem: TypeAlias = UserSupplement | UserMedication | UserTherapy
ItemType: TypeAlias = str


@dataclass(slots=True)
class ScheduledRegimenItem:
    item_type: ItemType
    item: ScheduleItem
    protocol_names: list[str]
    active_protocol_names: list[str]


@dataclass(slots=True)
class RegimenScheduleContext:
    user_supplements: list[UserSupplement]
    user_medications: list[UserMedication]
    user_therapies: list[UserTherapy]
    protocols_by_item_key: dict[tuple[str, str], list[Protocol]]


def resolve_user_date(target_date: date | None, timezone_name: str | None) -> tuple[date, ZoneInfo]:
    try:
        user_tz = ZoneInfo(timezone_name or "UTC")
    except ZoneInfoNotFoundError:
        user_tz = ZoneInfo("UTC")

    if target_date is not None:
        return target_date, user_tz

    return datetime.now(user_tz).date(), user_tz


def is_due_by_frequency(item: ScheduleItem, target_date: date) -> bool:
    if item.started_at > target_date:
        return False
    if item.ended_at and item.ended_at < target_date:
        return False

    days_since_start = (target_date - item.started_at).days
    frequency = item.frequency

    if frequency in {Frequency.daily, Frequency.twice_daily, Frequency.three_times_daily}:
        return True
    if frequency == Frequency.every_other_day:
        return days_since_start % 2 == 0
    if frequency == Frequency.weekly:
        return days_since_start % 7 == 0
    if frequency == Frequency.as_needed:
        return False
    return False


def scheduled_datetime_for_window(target_date: date, take_window: TakeWindow, user_tz: ZoneInfo) -> datetime:
    local_dt = datetime.combine(target_date, WINDOW_TIMES[take_window], tzinfo=user_tz)
    return local_dt.astimezone(timezone.utc)


def adherence_day_bounds(target_date: date, user_tz: ZoneInfo) -> tuple[datetime, datetime]:
    day_start_local = datetime.combine(target_date, time.min, tzinfo=user_tz)
    day_end_local = day_start_local + timedelta(days=1)
    return day_start_local.astimezone(timezone.utc), day_end_local.astimezone(timezone.utc)


async def load_regimen_schedule_context(user: User) -> RegimenScheduleContext:
    async with async_session_factory() as session:
        supplements_result = await session.execute(
            select(UserSupplement)
            .options(selectinload(UserSupplement.supplement))
            .where(
                UserSupplement.user_id == user.id,
                UserSupplement.is_active.is_(True),
            )
            .order_by(UserSupplement.take_window, UserSupplement.created_at)
        )
        user_supplements = list(supplements_result.scalars().all())

        medications_result = await session.execute(
            select(UserMedication)
            .options(selectinload(UserMedication.medication))
            .where(
                UserMedication.user_id == user.id,
                UserMedication.is_active.is_(True),
            )
            .order_by(UserMedication.take_window, UserMedication.created_at)
        )
        user_medications = list(medications_result.scalars().all())

        therapies_result = await session.execute(
            select(UserTherapy)
            .options(selectinload(UserTherapy.therapy))
            .where(
                UserTherapy.user_id == user.id,
                UserTherapy.is_active.is_(True),
            )
            .order_by(UserTherapy.take_window, UserTherapy.created_at)
        )
        user_therapies = list(therapies_result.scalars().all())

        protocols_result = await session.execute(
            select(Protocol)
            .where(
                Protocol.user_id == user.id,
                Protocol.is_active.is_(True),
            )
            .options(selectinload(Protocol.items))
            .order_by(Protocol.created_at.desc())
        )
        protocols = list(protocols_result.scalars().all())

    protocols_by_item_key: dict[tuple[str, str], list[Protocol]] = defaultdict(list)
    for protocol in protocols:
        for item in protocol.items:
            item_id = _protocol_item_id(item)
            if item_id is None:
                continue
            protocols_by_item_key[(item.item_type, item_id)].append(protocol)

    return RegimenScheduleContext(
        user_supplements=user_supplements,
        user_medications=user_medications,
        user_therapies=user_therapies,
        protocols_by_item_key=dict(protocols_by_item_key),
    )


def is_regimen_item_scheduled_for_date(
    context: RegimenScheduleContext,
    *,
    item_type: ItemType,
    item: ScheduleItem,
    target_date: date,
) -> bool:
    if not is_due_by_frequency(item, target_date):
        return False

    protocols = context.protocols_by_item_key.get((item_type, str(item.id)), [])
    scheduled_protocols = [protocol for protocol in protocols if protocol_has_schedule(protocol)]
    if not scheduled_protocols:
        return True

    return any(protocol_is_available_on_date(protocol, target_date) for protocol in scheduled_protocols)


def scheduled_regimen_items_for_date(
    context: RegimenScheduleContext,
    target_date: date,
) -> list[ScheduledRegimenItem]:
    scheduled_items: list[ScheduledRegimenItem] = []
    scheduled_items.extend(_scheduled_items_for_type(context, "supplement", context.user_supplements, target_date))
    scheduled_items.extend(_scheduled_items_for_type(context, "medication", context.user_medications, target_date))
    scheduled_items.extend(_scheduled_items_for_type(context, "therapy", context.user_therapies, target_date))
    return scheduled_items


def _scheduled_items_for_type(
    context: RegimenScheduleContext,
    item_type: ItemType,
    items: Iterable[ScheduleItem],
    target_date: date,
) -> list[ScheduledRegimenItem]:
    scheduled_items: list[ScheduledRegimenItem] = []
    for item in items:
        if not is_regimen_item_scheduled_for_date(context, item_type=item_type, item=item, target_date=target_date):
            continue

        protocols = context.protocols_by_item_key.get((item_type, str(item.id)), [])
        scheduled_items.append(
            ScheduledRegimenItem(
                item_type=item_type,
                item=item,
                protocol_names=[protocol.name for protocol in protocols],
                active_protocol_names=[
                    protocol.name for protocol in protocols if protocol_is_available_on_date(protocol, target_date)
                ],
            )
        )

    return scheduled_items


def _protocol_item_id(item: ProtocolItem) -> str | None:
    if item.item_type == "supplement" and item.user_supplement_id is not None:
        return str(item.user_supplement_id)
    if item.item_type == "medication" and item.user_medication_id is not None:
        return str(item.user_medication_id)
    if item.item_type == "therapy" and item.user_therapy_id is not None:
        return str(item.user_therapy_id)
    return None
