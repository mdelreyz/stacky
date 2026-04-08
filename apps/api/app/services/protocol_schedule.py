from datetime import date, datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.models.protocol import Protocol

PROTOCOL_SCHEDULE_TYPES = ("manual", "date_range", "week_of_month")


def protocol_has_schedule(protocol: Protocol) -> bool:
    return protocol.schedule_type in PROTOCOL_SCHEDULE_TYPES


def week_of_month(target_date: date) -> int:
    return ((target_date.day - 1) // 7) + 1


def protocol_is_available_on_date(protocol: Protocol, target_date: date) -> bool:
    if not protocol.is_active:
        return False

    if protocol.schedule_type is None:
        return True

    if protocol.schedule_type == "manual":
        return protocol.manual_is_active

    if protocol.schedule_type == "date_range":
        if protocol.schedule_start_date is None or protocol.schedule_end_date is None:
            return False
        return protocol.schedule_start_date <= target_date <= protocol.schedule_end_date

    if protocol.schedule_type == "week_of_month":
        weeks = [week for week in (protocol.weeks_of_month or []) if isinstance(week, int)]
        if not weeks:
            return False
        return week_of_month(target_date) in weeks

    return False


def protocol_schedule_payload(protocol: Protocol) -> dict | None:
    if not protocol_has_schedule(protocol):
        return None

    return {
        "type": protocol.schedule_type,
        "manual_is_active": protocol.manual_is_active,
        "start_date": protocol.schedule_start_date,
        "end_date": protocol.schedule_end_date,
        "weeks_of_month": list(protocol.weeks_of_month or []),
    }


def protocol_schedule_summary(protocol: Protocol) -> str:
    if not protocol.is_active:
        return "Archived"

    if protocol.schedule_type is None:
        return "Always available"

    if protocol.schedule_type == "manual":
        return "Manual regime is active" if protocol.manual_is_active else "Manual regime is paused"

    if protocol.schedule_type == "date_range":
        if protocol.schedule_start_date and protocol.schedule_end_date:
            start = f"{protocol.schedule_start_date.strftime('%b')} {protocol.schedule_start_date.day}"
            end = f"{protocol.schedule_end_date.strftime('%b')} {protocol.schedule_end_date.day}"
            return f"Scheduled for {start} to {end}"
        return "Date-range schedule"

    if protocol.schedule_type == "week_of_month":
        weeks = ", ".join(str(week) for week in (protocol.weeks_of_month or []))
        return f"Weeks {weeks} of each month" if weeks else "Week-of-month schedule"

    return "Scheduled"


def protocol_is_currently_active(protocol: Protocol, *, timezone_name: str | None) -> bool:
    if not protocol.is_active:
        return False

    if protocol.schedule_type is None:
        return True

    try:
        user_tz = ZoneInfo(timezone_name or "UTC")
    except ZoneInfoNotFoundError:
        user_tz = ZoneInfo("UTC")

    target_date = datetime.now(user_tz).date()
    return protocol_is_available_on_date(protocol, target_date)
