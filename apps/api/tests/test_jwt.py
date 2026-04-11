import asyncio
from datetime import datetime, timedelta, timezone

from app import jwt as jwt_module
from app.database import async_session_factory
from app.models.revoked_token import RevokedToken


class ExplodingRedis:
    async def exists(self, *_args, **_kwargs):
        raise RuntimeError("redis unavailable")

    async def setex(self, *_args, **_kwargs):
        raise RuntimeError("redis unavailable")


def test_is_token_revoked_gracefully_handles_redis_outage(monkeypatch):
    async def fake_get_redis():
        return ExplodingRedis()

    jwt_module._revoked_tokens.clear()
    jwt_module._redis_client = object()
    monkeypatch.setattr(jwt_module, "_get_redis", fake_get_redis)

    token = jwt_module.create_access_token("user-1")

    assert asyncio.run(jwt_module.is_token_revoked(token)) is False
    assert jwt_module._redis_client is None


def test_revoke_token_falls_back_to_in_memory_when_redis_and_db_fail(monkeypatch):
    async def fake_get_redis():
        return ExplodingRedis()

    async def exploding_mark_revoked(_fingerprint: str, _ttl: int) -> None:
        raise RuntimeError("database unavailable")

    async def exploding_is_revoked(_fingerprint: str) -> bool:
        raise RuntimeError("database unavailable")

    jwt_module._revoked_tokens.clear()
    jwt_module._redis_client = object()
    monkeypatch.setattr(jwt_module, "_get_redis", fake_get_redis)
    monkeypatch.setattr(jwt_module, "_mark_revoked_in_database", exploding_mark_revoked)
    monkeypatch.setattr(jwt_module, "_is_revoked_in_database", exploding_is_revoked)

    token = jwt_module.create_access_token("user-2")

    asyncio.run(jwt_module.revoke_token(token))

    assert asyncio.run(jwt_module.is_token_revoked(token)) is True


async def _load_revoked_token(fingerprint: str) -> RevokedToken | None:
    async with async_session_factory() as session:
        return await session.get(RevokedToken, fingerprint)


async def _create_revoked_token(fingerprint: str, expires_at: datetime) -> None:
    async with async_session_factory() as session:
        session.add(RevokedToken(fingerprint=fingerprint, expires_at=expires_at))
        await session.commit()


def test_revoke_token_persists_to_database_when_redis_fails(monkeypatch):
    async def fake_get_redis():
        return ExplodingRedis()

    jwt_module._revoked_tokens.clear()
    jwt_module._redis_client = object()
    monkeypatch.setattr(jwt_module, "_get_redis", fake_get_redis)

    token = jwt_module.create_access_token("user-3")
    fingerprint = jwt_module._token_fingerprint(token)

    asyncio.run(jwt_module.revoke_token(token))
    jwt_module._revoked_tokens.clear()

    revoked_token = asyncio.run(_load_revoked_token(fingerprint))

    assert revoked_token is not None
    assert asyncio.run(jwt_module.is_token_revoked(token)) is True


def test_is_token_revoked_cleans_expired_database_fallback(monkeypatch):
    async def fake_get_redis():
        return ExplodingRedis()

    jwt_module._revoked_tokens.clear()
    jwt_module._redis_client = object()
    monkeypatch.setattr(jwt_module, "_get_redis", fake_get_redis)

    token = jwt_module.create_access_token("user-4")
    fingerprint = jwt_module._token_fingerprint(token)
    expires_at = jwt_module._utcnow_for_store() - timedelta(minutes=1)

    asyncio.run(_create_revoked_token(fingerprint, expires_at))

    assert asyncio.run(jwt_module.is_token_revoked(token)) is False
    assert asyncio.run(_load_revoked_token(fingerprint)) is None
