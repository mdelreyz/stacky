import os
import time
import uuid as _uuid
from datetime import datetime, timedelta, timezone
from hashlib import sha256

import bcrypt
from jose import jwt
from sqlalchemy import delete

from app.config import settings
from app.database import async_session_factory
from app.models.revoked_token import RevokedToken

COOKIE_NAME = "protocols_session"

# In-memory fallback for token revocation when Redis is unavailable
_revoked_tokens: dict[str, float] = {}
_redis_client = None


def _utcnow_for_store() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def _token_fingerprint(token: str) -> str:
    return sha256(token.encode()).hexdigest()[:32]


def create_access_token(user_id: str, jti: str | None = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_access_token_expire_minutes)
    payload = {
        "sub": user_id,
        "exp": expire,
        "jti": jti or _uuid.uuid4().hex,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])


async def _get_redis():
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    try:
        import redis.asyncio as aioredis

        _redis_client = aioredis.from_url(settings.redis_url, decode_responses=True)
        await _redis_client.ping()
        return _redis_client
    except Exception:
        _redis_client = None
        return None


async def close_redis() -> None:
    global _redis_client
    if _redis_client:
        await _redis_client.close()
        _redis_client = None


def _mark_revoked_in_memory(fingerprint: str, ttl: int) -> None:
    _revoked_tokens[fingerprint] = time.time() + ttl


def _is_revoked_in_memory(fingerprint: str) -> bool:
    expiry = _revoked_tokens.get(fingerprint)
    if expiry is None:
        return False
    if time.time() < expiry:
        return True
    del _revoked_tokens[fingerprint]
    return False


def _drop_redis_client() -> None:
    global _redis_client
    _redis_client = None


async def _mark_revoked_in_database(fingerprint: str, ttl: int) -> None:
    now = _utcnow_for_store()
    expires_at = now + timedelta(seconds=ttl)
    async with async_session_factory() as session:
        await session.execute(delete(RevokedToken).where(RevokedToken.expires_at <= now))
        revoked_token = await session.get(RevokedToken, fingerprint)
        if revoked_token is None:
            session.add(RevokedToken(fingerprint=fingerprint, expires_at=expires_at))
        else:
            revoked_token.expires_at = expires_at
        await session.commit()


async def _is_revoked_in_database(fingerprint: str) -> bool:
    now = _utcnow_for_store()
    async with async_session_factory() as session:
        revoked_token = await session.get(RevokedToken, fingerprint)
        if revoked_token is None:
            return False
        if revoked_token.expires_at <= now:
            await session.delete(revoked_token)
            await session.commit()
            return False
        return True


async def revoke_token(token: str) -> None:
    fingerprint = _token_fingerprint(token)
    ttl = settings.jwt_access_token_expire_minutes * 60
    r = await _get_redis()
    if r:
        try:
            await r.setex(f"revoked:{fingerprint}", ttl, "1")
            return
        except Exception:
            _drop_redis_client()
    try:
        await _mark_revoked_in_database(fingerprint, ttl)
        return
    except Exception:
        _mark_revoked_in_memory(fingerprint, ttl)


async def is_token_revoked(token: str) -> bool:
    fingerprint = _token_fingerprint(token)
    r = await _get_redis()
    if r:
        try:
            return await r.exists(f"revoked:{fingerprint}") > 0
        except Exception:
            _drop_redis_client()
    try:
        return await _is_revoked_in_database(fingerprint)
    except Exception:
        return _is_revoked_in_memory(fingerprint)


def set_auth_cookie(response, token: str) -> None:
    is_production = os.getenv("PROTOCOLS_ENVIRONMENT", "").lower() == "production"
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=settings.jwt_access_token_expire_minutes * 60,
        path="/",
    )
