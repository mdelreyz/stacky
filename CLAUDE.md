# Protocols

Cross-platform health protocol management app (iOS + Android + Web).

## Stack

- **Backend:** FastAPI (Python 3.12+), async SQLAlchemy 2.0, PostgreSQL, Alembic, Celery + Redis
- **Frontend:** Expo (React Native) + Expo Router for all platforms
- **Styling:** NativeWind (Tailwind for React Native)
- **AI:** Claude Sonnet via `anthropic` SDK for supplement onboarding
- **Monorepo:** pnpm workspaces + Turborepo

## Structure

```
apps/api/         — FastAPI backend (Python)
apps/worker/      — Celery workers (Python)
apps/mobile/      — Expo app (iOS + Android + Web)
packages/domain/  — Shared TypeScript types
packages/api-client/ — Typed API client
```

## Development Commands

```bash
# Backend (from apps/api/)
uv venv && source .venv/bin/activate
uv pip install -e ".[test]"
uvicorn app.main:app --reload --port 8000

# Migrations
cd apps/api && alembic revision --autogenerate -m "description"
cd apps/api && alembic upgrade head

# Mobile (from apps/mobile/)
npx expo start

# Docker (all services)
docker compose up

# Tests
cd apps/api && pytest
```

## Conventions

- **Backend patterns match Pempta** (../vitalsync): same auth, database, route, and service patterns
- **Settings prefix:** `PROTOCOLS_` (e.g., `PROTOCOLS_DATABASE_URL`)
- **Models:** SQLAlchemy 2.0 Mapped type hints, UUID primary keys, `created_at`/`updated_at` timestamps
- **Schemas:** Pydantic v2, `model_config = {"from_attributes": True}`, request/response separation
- **Routes:** APIRouter with prefix/tags, dependency injection, pagination with `has_more`
- **AI profiles:** Stored as JSONB on supplement/therapy rows — generated once, reused by all users
- **Enums:** Python `str, enum.Enum` pattern for database-safe enums

## Key Files

- `apps/api/app/models/supplement.py` — Core domain model with `ai_profile` JSONB
- `apps/api/app/routes/supplements.py` — Supplement catalog + onboarding endpoint
- `apps/api/app/routes/user_supplements.py` — Per-user supplement management
- `packages/domain/src/supplement.ts` — TypeScript AI profile interface
- `packages/api-client/src/client.ts` — Typed API client

## Pempta Integration

Deferred. The architecture accommodates future integration via OAuth + REST API calls to ../vitalsync, but it is not part of the current build.

<!-- noomix:start -->
# Decision Graph (noomix)

This project uses [noomix](https://github.com/mdelreyz/noomix) to track architectural decisions, rejected alternatives, and deferred explorations.

## Session lifecycle

### Start of session
Call `sitrep` with `repo_path` set to the working directory at the start of every session. The project name is derived automatically from the folder name — no need to pass it. Share the current state with the user before asking what they want to work on.

### During session
**MANDATORY — no exceptions:** Call `observe` after every 2 user messages. Do NOT defer, batch, or skip. Do NOT wait for a milestone, a commit, or the end of a task. If you are mid-task when the 2-message threshold is reached, call `observe` RIGHT THEN before continuing your work. Also call `observe` immediately when the user makes a decision, rejects a proposal, corrects you, or changes direction. Failure to observe means the user's reasoning is lost forever — this is unacceptable.

**User signal capture:** Pay close attention to when the user expresses ideas, states preferences, marks something as important ("this matters", "focus on", "the key thing is"), or signals caution ("be careful with", "make sure", "don't forget", "pay attention to"). These MUST be captured with `actor: "user"`. When the user expresses doubt or worry ("I'm not sure about this", "feels wrong", "are we going the right way?"), call `observe` with `type: "concern"` and `actor: "user"`. Under-capturing user signals is the #1 failure mode — if in doubt, observe it.

Before proposing a significant technical direction, call `align` with a description of the approach. Noomix will check it against past decisions and tell you what was tried, what failed, and what the user's preferences suggest. Think of it as consulting the user's judgment when they aren't actively steering.

**Code anchors:** When calling `observe` for decisions involving code, include the `anchors` parameter: `[{file: "src/foo.ts", symbol: "myFunc", role: "defines config"}]`. Use role verbs like defines, reads, writes, persists, loads, produces, consumes. This enables impact chain detection — noomix can warn about downstream code that needs updating when a change is proposed.

### End of session
Before exiting, call `observe` with a summary of the overall session direction:
- `title`: concise phrase capturing the session theme
- `description`: 1-2 sentences on what was explored or built
- `rationale`: the key reasoning or insight that emerged
- `type`: "milestone" if something shipped, "decision" if a direction was set, "thought" otherwise
<!-- noomix:end -->
