import asyncio
import json
import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Literal

from anthropic import Anthropic
from pydantic import BaseModel, ConfigDict, ValidationError
from sqlalchemy import select

from app.config import settings
from app.database import async_session_factory
from app.models.supplement import Supplement, SupplementCategory

logger = logging.getLogger(__name__)

AIProfileStatus = Literal["ready", "generating", "failed"]

_STATUS_TTL_SECONDS = 60 * 60 * 24
_status_cache: dict[str, dict[str, str | float | None]] = {}
_status_redis_client = None


class AIProfileGenerationError(RuntimeError):
    pass


class DosageRecommendation(BaseModel):
    amount: float
    unit: str
    frequency: str
    context: str

    model_config = ConfigDict(extra="forbid")


class BioavailabilityProfile(BaseModel):
    notes: str
    enhancers: list[str]
    inhibitors: list[str]

    model_config = ConfigDict(extra="forbid")


class HalfLifeProfile(BaseModel):
    hours: str
    notes: str

    model_config = ConfigDict(extra="forbid")


class TimingRecommendations(BaseModel):
    preferred_windows: list[str]
    avoid_windows: list[str]
    with_food: bool
    food_interactions: str
    notes: str

    model_config = ConfigDict(extra="forbid")


class CyclingPattern(BaseModel):
    on_weeks: int
    off_weeks: int

    model_config = ConfigDict(extra="forbid")


class CyclingRecommendations(BaseModel):
    suggested: bool
    typical_pattern: CyclingPattern | None
    rationale: str

    model_config = ConfigDict(extra="forbid")


class KnownInteraction(BaseModel):
    substance: str
    type: Literal["contraindication", "caution"]
    severity: Literal["critical", "major", "moderate", "minor"]
    description: str

    model_config = ConfigDict(extra="forbid")


class SynergyProfile(BaseModel):
    substance: str
    benefit: str
    mechanism: str

    model_config = ConfigDict(extra="forbid")


class SupplementAIProfile(BaseModel):
    common_names: list[str]
    category: SupplementCategory
    mechanism_of_action: str
    typical_dosages: list[DosageRecommendation]
    forms: list[str]
    bioavailability: BioavailabilityProfile
    half_life: HalfLifeProfile
    timing_recommendations: TimingRecommendations
    cycling_recommendations: CyclingRecommendations
    known_interactions: list[KnownInteraction]
    synergies: list[SynergyProfile]
    contraindications: list[str]
    side_effects: list[str]
    safety_notes: str
    evidence_quality: Literal["strong", "moderate", "limited", "emerging"]
    sources_summary: str

    model_config = ConfigDict(extra="forbid")


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


def _status_key(supplement_id: str) -> str:
    return f"supplement-ai-status:{supplement_id}"


async def set_ai_status(
    supplement_id: str,
    status: AIProfileStatus,
    error: str | None = None,
) -> None:
    payload = json.dumps({"status": status, "error": error})
    redis_client = await _get_status_redis()
    if redis_client:
        await redis_client.setex(_status_key(supplement_id), _STATUS_TTL_SECONDS, payload)
        return

    _status_cache[supplement_id] = {
        "status": status,
        "error": error,
        "expires_at": time.time() + _STATUS_TTL_SECONDS,
    }


async def get_ai_status(supplement_id: str) -> tuple[AIProfileStatus, str | None] | None:
    redis_client = await _get_status_redis()
    if redis_client:
        raw = await redis_client.get(_status_key(supplement_id))
        if not raw:
            return None
        data = json.loads(raw)
        return data["status"], data.get("error")

    cached = _status_cache.get(supplement_id)
    if not cached:
        return None

    expires_at = cached.get("expires_at")
    if isinstance(expires_at, (int, float)) and time.time() >= expires_at:
        _status_cache.pop(supplement_id, None)
        return None

    return cached["status"], cached.get("error")  # type: ignore[return-value]


async def resolve_ai_status(supplement: Supplement) -> tuple[AIProfileStatus, str | None]:
    if supplement.ai_profile:
        return "ready", None

    status = await get_ai_status(str(supplement.id))
    if status is not None:
        return status

    return "generating", None


def _build_prompt(name: str, category: str | None, form: str | None) -> str:
    category_line = category or "other"
    form_line = form or "unknown"
    return f"""
Generate a structured supplement profile for a health protocol management app.

Supplement name: {name}
Requested category: {category_line}
Requested form: {form_line}

Requirements:
- Use evidence-grounded, consumer-safe language.
- Keep every field populated. Use empty arrays when needed, never null except where the schema allows it.
- Prefer the allowed take windows only: morning_fasted, morning_with_food, midday, afternoon, evening, bedtime.
- Keep interaction and contraindication names machine-friendly with snake_case strings.
- If the exact branded form is unclear, infer a reasonable generic supplement profile.
- Do not mention that this content was AI-generated.
""".strip()


def generate_supplement_profile(name: str, category: str | None, form: str | None) -> dict:
    if not settings.anthropic_api_key:
        raise AIProfileGenerationError("Anthropic API key is not configured.")

    client = Anthropic(api_key=settings.anthropic_api_key)
    response = client.messages.create(
        model=settings.ai_model,
        max_tokens=2400,
        temperature=0.2,
        system=(
            "You generate supplement reference data for a health app. "
            "Return only structured output that matches the provided schema."
        ),
        messages=[{"role": "user", "content": _build_prompt(name, category, form)}],
        output_config={
            "effort": "low",
            "format": {
                "type": "json_schema",
                "schema": SupplementAIProfile.model_json_schema(),
            },
        },
    )

    payload = "".join(block.text for block in response.content if getattr(block, "type", None) == "text").strip()
    if not payload:
        raise AIProfileGenerationError("Anthropic returned an empty response.")

    try:
        parsed = json.loads(payload)
    except json.JSONDecodeError as exc:
        raise AIProfileGenerationError("Anthropic returned invalid JSON.") from exc

    try:
        profile = SupplementAIProfile.model_validate(parsed)
    except ValidationError as exc:
        raise AIProfileGenerationError("Anthropic returned an invalid supplement profile schema.") from exc

    return profile.model_dump(mode="json")


def _public_error_message(exc: Exception) -> str:
    if isinstance(exc, AIProfileGenerationError):
        return str(exc)
    return "AI profile generation failed. Please retry."


async def run_ai_onboarding_job(supplement_id: str) -> None:
    supplement_uuid = uuid.UUID(supplement_id)

    async with async_session_factory() as session:
        result = await session.execute(select(Supplement).where(Supplement.id == supplement_uuid))
        supplement = result.scalar_one_or_none()
        if supplement is None:
            logger.warning("Skipped AI onboarding for missing supplement %s", supplement_id)
            return

        await set_ai_status(supplement_id, "generating")

        try:
            profile = await asyncio.to_thread(
                generate_supplement_profile,
                supplement.name,
                supplement.category.value if supplement.category else None,
                supplement.form,
            )
            supplement.ai_profile = profile
            supplement.ai_generated_at = datetime.now(timezone.utc)
            await session.commit()
        except Exception as exc:
            await session.rollback()
            message = _public_error_message(exc)
            await set_ai_status(supplement_id, "failed", message)
            logger.exception("AI onboarding failed for supplement %s", supplement_id)
            return

    await set_ai_status(supplement_id, "ready")


def run_ai_onboarding_job_sync(supplement_id: str) -> None:
    asyncio.run(run_ai_onboarding_job(supplement_id))
