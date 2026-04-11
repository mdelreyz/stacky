import asyncio
import json
import logging
import os
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Literal

from sqlalchemy import select

from app.config import settings
from app.database import async_session_factory
from app.models.medication import Medication
from app.models.supplement import Supplement
from app.services.ai_profile_generation import (
    AIProfileGenerationError,
    generate_medication_profile,
    generate_supplement_profile,
    get_ai_unavailable_reason,
)

logger = logging.getLogger(__name__)

AIProfileStatus = Literal["ready", "generating", "failed"]

_STATUS_TTL_SECONDS = 60 * 60 * 24
_STATUS_CACHE_MAX_ENTRIES = 1024
_status_cache: dict[str, dict[str, str | float | None]] = {}
_status_redis_client = None


def should_dispatch_ai_tasks_with_celery() -> bool:
    if settings.ai_task_dispatch_mode == "background":
        return False
    if settings.ai_task_dispatch_mode == "celery":
        return True
    return os.getenv("PROTOCOLS_ENVIRONMENT", "").lower() == "production"


def reset_ai_status_cache() -> None:
    global _status_redis_client
    _status_cache.clear()
    _status_redis_client = None


async def _get_status_redis():
    global _status_redis_client
    if _status_redis_client is not None:
        return _status_redis_client

    try:
        import redis.asyncio as redis_async

        _status_redis_client = redis_async.from_url(settings.redis_url, decode_responses=True)
        await _status_redis_client.ping()
        return _status_redis_client
    except Exception:
        _status_redis_client = None
        return None


def _status_key(item_id: str, kind: str = "supplement") -> str:
    return f"{kind}-ai-status:{item_id}"


def _cache_ai_status_in_memory(
    cache_key: str,
    status: AIProfileStatus,
    error: str | None = None,
) -> None:
    now = time.time()
    _prune_status_cache(now)
    _status_cache[cache_key] = {
        "status": status,
        "error": error,
        "expires_at": now + _STATUS_TTL_SECONDS,
    }
    _prune_status_cache(now)


def _prune_status_cache(now: float | None = None) -> None:
    current_time = time.time() if now is None else now

    expired_keys = [
        key
        for key, cached in _status_cache.items()
        if isinstance(cached.get("expires_at"), (int, float)) and current_time >= cached["expires_at"]
    ]
    for key in expired_keys:
        _status_cache.pop(key, None)

    overflow = len(_status_cache) - _STATUS_CACHE_MAX_ENTRIES
    if overflow <= 0:
        return

    oldest_keys = sorted(
        _status_cache,
        key=lambda key: (
            _status_cache[key].get("expires_at")
            if isinstance(_status_cache[key].get("expires_at"), (int, float))
            else float("inf")
        ),
    )[:overflow]
    for key in oldest_keys:
        _status_cache.pop(key, None)


def _get_cached_ai_status(cache_key: str) -> tuple[AIProfileStatus, str | None] | None:
    _prune_status_cache()
    cached = _status_cache.get(cache_key)
    if not cached:
        return None

    return cached["status"], cached.get("error")  # type: ignore[return-value]


def _drop_status_redis_client() -> None:
    global _status_redis_client
    _status_redis_client = None


async def set_ai_status(
    item_id: str,
    status: AIProfileStatus,
    error: str | None = None,
    kind: str = "supplement",
) -> None:
    payload = json.dumps({"status": status, "error": error})
    cache_key = _status_key(item_id, kind)
    redis_client = await _get_status_redis()
    if redis_client:
        try:
            await redis_client.setex(cache_key, _STATUS_TTL_SECONDS, payload)
            return
        except Exception:
            _drop_status_redis_client()

    _cache_ai_status_in_memory(cache_key, status, error)


async def get_ai_status(item_id: str, kind: str = "supplement") -> tuple[AIProfileStatus, str | None] | None:
    cache_key = _status_key(item_id, kind)
    redis_client = await _get_status_redis()
    if redis_client:
        try:
            raw = await redis_client.get(cache_key)
            if not raw:
                return None
            data = json.loads(raw)
            return data["status"], data.get("error")
        except Exception:
            _drop_status_redis_client()

    return _get_cached_ai_status(cache_key)


async def _resolve_entity_ai_status(
    item_id: str,
    ai_profile: dict[str, Any] | None,
    *,
    kind: str = "supplement",
) -> tuple[AIProfileStatus, str | None]:
    if ai_profile:
        return "ready", None

    status = await get_ai_status(item_id, kind=kind)
    if status is not None:
        return status

    return "failed", "AI profile generation is not running for this item. Retry onboarding to generate it."


async def resolve_ai_status(supplement: Supplement) -> tuple[AIProfileStatus, str | None]:
    return await _resolve_entity_ai_status(str(supplement.id), supplement.ai_profile)


async def resolve_medication_ai_status(medication: Medication) -> tuple[AIProfileStatus, str | None]:
    return await _resolve_entity_ai_status(
        str(medication.id),
        medication.ai_profile,
        kind="medication",
    )


def _public_error_message(exc: Exception) -> str:
    if isinstance(exc, AIProfileGenerationError):
        return str(exc)

    message = str(exc).lower()
    if any(token in message for token in ("credit", "credits", "quota", "billing", "insufficient")):
        return "AI profile generation is unavailable because the Anthropic account is out of credits. Purchase more credits and retry."
    if any(token in message for token in ("api key", "authentication", "auth", "unauthorized", "forbidden")):
        return "AI profile generation failed because the Anthropic credentials were rejected. Update the API key and retry."
    if any(
        token in message
        for token in ("connection", "connect", "network", "dns", "timed out", "timeout", "temporarily unavailable")
    ):
        return "AI profile generation could not reach Anthropic. Check the network connection and retry."
    return "AI profile generation failed. Please retry."


async def _run_catalog_ai_onboarding_job(
    item_id: str,
    *,
    kind: str,
    model_class: type[Supplement] | type[Medication],
    generate_profile: Callable[[str, str | None, str | None], dict],
) -> None:
    item_uuid = uuid.UUID(item_id)

    async with async_session_factory() as session:
        result = await session.execute(select(model_class).where(model_class.id == item_uuid))
        item = result.scalar_one_or_none()
        if item is None:
            logger.warning("Skipped AI onboarding for missing %s %s", kind, item_id)
            return

        await set_ai_status(item_id, "generating", kind=kind)

        try:
            profile = await asyncio.to_thread(
                generate_profile,
                item.name,
                item.category.value if item.category else None,
                item.form,
            )
            item.ai_profile = profile
            item.ai_generated_at = datetime.now(timezone.utc)
            await session.commit()
        except Exception as exc:
            await session.rollback()
            message = _public_error_message(exc)
            await set_ai_status(item_id, "failed", message, kind=kind)
            logger.exception("AI onboarding failed for %s %s", kind, item_id)
            return

    await set_ai_status(item_id, "ready", kind=kind)


async def run_ai_onboarding_job(supplement_id: str) -> None:
    await _run_catalog_ai_onboarding_job(
        supplement_id,
        kind="supplement",
        model_class=Supplement,
        generate_profile=generate_supplement_profile,
    )


def run_ai_onboarding_job_sync(supplement_id: str) -> None:
    asyncio.run(run_ai_onboarding_job(supplement_id))


async def run_medication_ai_onboarding_job(medication_id: str) -> None:
    await _run_catalog_ai_onboarding_job(
        medication_id,
        kind="medication",
        model_class=Medication,
        generate_profile=generate_medication_profile,
    )


def run_medication_ai_onboarding_job_sync(medication_id: str) -> None:
    asyncio.run(run_medication_ai_onboarding_job(medication_id))
