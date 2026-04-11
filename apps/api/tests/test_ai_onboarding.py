import asyncio

from app.services import ai_onboarding


class ExplodingRedis:
    async def get(self, *_args, **_kwargs):
        raise RuntimeError("redis unavailable")

    async def setex(self, *_args, **_kwargs):
        raise RuntimeError("redis unavailable")


def test_set_ai_status_falls_back_to_in_memory_when_redis_fails(monkeypatch):
    async def fake_get_status_redis():
        return ExplodingRedis()

    ai_onboarding.reset_ai_status_cache()
    ai_onboarding._status_redis_client = object()
    monkeypatch.setattr(ai_onboarding, "_get_status_redis", fake_get_status_redis)

    asyncio.run(ai_onboarding.set_ai_status("supp-1", "failed", "Generation failed."))

    assert asyncio.run(ai_onboarding.get_ai_status("supp-1")) == ("failed", "Generation failed.")
    assert ai_onboarding._status_redis_client is None


def test_get_ai_status_gracefully_handles_redis_outage(monkeypatch):
    async def fake_get_status_redis():
        return ExplodingRedis()

    ai_onboarding.reset_ai_status_cache()
    ai_onboarding._status_redis_client = object()
    monkeypatch.setattr(ai_onboarding, "_get_status_redis", fake_get_status_redis)

    assert asyncio.run(ai_onboarding.get_ai_status("missing-item")) is None
    assert ai_onboarding._status_redis_client is None


def test_should_dispatch_ai_tasks_with_celery_defaults_to_background_outside_production(monkeypatch):
    monkeypatch.setattr(ai_onboarding.settings, "ai_task_dispatch_mode", "auto")
    monkeypatch.delenv("PROTOCOLS_ENVIRONMENT", raising=False)

    assert ai_onboarding.should_dispatch_ai_tasks_with_celery() is False


def test_should_dispatch_ai_tasks_with_celery_uses_celery_in_production_auto_mode(monkeypatch):
    monkeypatch.setattr(ai_onboarding.settings, "ai_task_dispatch_mode", "auto")
    monkeypatch.setenv("PROTOCOLS_ENVIRONMENT", "production")

    assert ai_onboarding.should_dispatch_ai_tasks_with_celery() is True


def test_in_memory_status_cache_prunes_expired_entries(monkeypatch):
    ai_onboarding.reset_ai_status_cache()
    monkeypatch.setattr(ai_onboarding.time, "time", lambda: 1000.0)
    ai_onboarding._cache_ai_status_in_memory("supplement-ai-status:expired", "generating")

    monkeypatch.setattr(ai_onboarding.time, "time", lambda: 1000.0 + ai_onboarding._STATUS_TTL_SECONDS + 1)
    ai_onboarding._cache_ai_status_in_memory("supplement-ai-status:fresh", "failed", "Generation failed.")

    assert "supplement-ai-status:expired" not in ai_onboarding._status_cache
    assert ai_onboarding._get_cached_ai_status("supplement-ai-status:fresh") == ("failed", "Generation failed.")


def test_in_memory_status_cache_prunes_oldest_entries_when_over_capacity(monkeypatch):
    ai_onboarding.reset_ai_status_cache()
    monkeypatch.setattr(ai_onboarding, "_STATUS_CACHE_MAX_ENTRIES", 2)

    clock = {"now": 1000.0}

    def fake_time():
        return clock["now"]

    monkeypatch.setattr(ai_onboarding.time, "time", fake_time)

    ai_onboarding._cache_ai_status_in_memory("supplement-ai-status:first", "generating")
    clock["now"] += 1
    ai_onboarding._cache_ai_status_in_memory("supplement-ai-status:second", "generating")
    clock["now"] += 1
    ai_onboarding._cache_ai_status_in_memory("supplement-ai-status:third", "failed", "Boom")

    assert len(ai_onboarding._status_cache) == 2
    assert "supplement-ai-status:first" not in ai_onboarding._status_cache
    assert ai_onboarding._get_cached_ai_status("supplement-ai-status:second") == ("generating", None)
    assert ai_onboarding._get_cached_ai_status("supplement-ai-status:third") == ("failed", "Boom")
