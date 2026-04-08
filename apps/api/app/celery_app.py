from celery import Celery

from app.config import settings


def _default_result_backend() -> str:
    if settings.redis_url.startswith(("redis://", "rediss://")) and "/" in settings.redis_url:
        base, _, _db = settings.redis_url.rpartition("/")
        if base:
            return f"{base}/1"
    return settings.redis_url


celery_app = Celery(
    "protocols-worker",
    broker=settings.redis_url,
    backend=_default_result_backend(),
    include=["app.tasks.ai_onboarding"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)
