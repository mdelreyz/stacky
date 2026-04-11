from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import Base, engine
from app.models import *  # noqa: F401, F403 — register all models with Base
from app.rate_limit import limiter
from app.routes import v1_router
from app.services.take_window_compat import normalize_legacy_take_window_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables for SQLite (dev/test only)
    if "sqlite" in settings.database_url:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    await normalize_legacy_take_window_data()
    yield
    await engine.dispose()
    from app.jwt import close_redis

    await close_redis()


app = FastAPI(
    title="Protocols API",
    description="Health protocol management — supplements, therapies, nutrition cycling",
    version="0.1.0",
    lifespan=lifespan,
)
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def _rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(status_code=429, content={"detail": "Too many requests. Please try again later."})


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "app": "protocols"}


app.include_router(v1_router)
