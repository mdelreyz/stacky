import asyncio
import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

TESTS_DIR = Path(__file__).resolve().parent
API_ROOT = TESTS_DIR.parent
TEST_DB_PATH = TESTS_DIR / "test_protocols.db"

os.environ.setdefault("PROTOCOLS_DATABASE_URL", f"sqlite+aiosqlite:///{TEST_DB_PATH}")
os.environ.setdefault("PROTOCOLS_REDIS_URL", "redis://localhost:6379/15")
os.environ.setdefault("PROTOCOLS_RATE_LIMIT_ENABLED", "false")
os.environ.setdefault("PROTOCOLS_AI_TASK_DISPATCH_MODE", "celery")

sys.path.insert(0, str(API_ROOT))

from app.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.services.ai_onboarding import reset_ai_status_cache  # noqa: E402


@pytest.fixture(autouse=True)
def reset_db():
    async def _reset() -> None:
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.drop_all)
                await conn.run_sync(Base.metadata.create_all)
        except OperationalError:
            await engine.dispose()
            TEST_DB_PATH.unlink(missing_ok=True)
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)

    asyncio.run(_reset())
    reset_ai_status_cache()
    yield


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
