from app.celery_app import celery_app
from app.services.notifications import dispatch_due_reminders_sync


@celery_app.task(name="notifications.dispatch_due_reminders")
def dispatch_due_reminders(target_time_iso: str | None = None, lookback_minutes: int | None = None) -> dict:
    return dispatch_due_reminders_sync(
        dispatch_at_iso=target_time_iso,
        lookback_minutes=lookback_minutes,
    )
