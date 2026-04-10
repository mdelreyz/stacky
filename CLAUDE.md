# Protocols

Cross-platform health protocol management app — supplements, medications, therapies, peptides, and nutrition orchestrated into personalized daily plans with AI-powered recommendations and one-tap tracking.

---

## Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | FastAPI (Python 3.12+), async SQLAlchemy 2.0, PostgreSQL, Alembic |
| **Workers** | Celery + Redis (AI profile generation, background tasks) |
| **Frontend** | Expo (React Native) + Expo Router — iOS, Android, Web |
| **Styling** | `StyleSheet.create` + `colors` design token (`Colors.ts`) |
| **AI** | Claude Sonnet via `anthropic` SDK — onboarding, recommendations |
| **Monorepo** | pnpm workspaces + Turborepo |

---

## Architecture

```
apps/
  api/                  FastAPI backend
    app/
      models/           SQLAlchemy domain models (23 mapped classes)
      routes/           API endpoints (22 routers)
      schemas/          Pydantic v2 request/response schemas
      services/         Business logic (scheduling, recommendations, AI, stats)
    scripts/            Seed data, catalog definitions
    tests/              102 integration tests
  worker/               Celery task definitions
  mobile/               Expo app (iOS + Android + Web)

packages/
  domain/               Shared TypeScript types (source of truth for frontend)
  api-client/           Typed API client (ProtocolsAPI class)
```

---

## Domain Pillars

Six independent item types, each with a shared catalog and per-user instances:

| Pillar | Catalog Model | User Model | Key Fields |
|--------|--------------|------------|------------|
| **Supplements** | `Supplement` | `UserSupplement` | 3-layer taxonomy (category + goals + mechanism_tags), AI profiles |
| **Medications** | `Medication` | `UserMedication` | Use-case categories, AI profiles with drug_class + monitoring |
| **Therapies** | `Therapy` | `UserTherapy` | Duration, settings JSON, last_completed_at tracking |
| **Peptides** | `Peptide` | `UserPeptide` | Route (subQ/IM/topical), reconstitution, storage_notes |
| **Nutrition** | `NutritionCycle` | (self-contained) | Cycle types, phases, macro profiles, fasting patterns |
| **Exercise** | `Exercise` | `WorkoutRoutine` / `ExerciseRegime` / `WorkoutSession` | Routines with sets/reps/weight, weekly regime scheduling, session logging, per-exercise stats, GPS gym locations |

### Supplement Taxonomy (3-layer)

1. **Primary category** — one body system: `healthy_aging`, `energy_mitochondria`, `brain_mood_stress`, `sleep_recovery`, `cardiovascular`, `glucose_metabolic`, `gut_digestion`, `detox_binding`, `immune_antimicrobial`, `inflammation_antioxidant`, `hormones_fertility`, `musculoskeletal`
2. **Goal tags** — 0-3 user-facing goals: `longevity`, `cognitive`, `sleep`, `energy`, `skin`, `hair`, etc.
3. **Mechanism tags** — scientific descriptors: `antioxidant`, `adaptogen`, `senolytic`, `NAD+ pathway`, `AMPK activator`, etc.

---

## Core Systems

### Protocols (Named Stacks)
Users group items into named protocols ("Morning Stack", "Hair Protocol"). Protocols support:
- Mixed item types (supplements + medications + therapies + peptides)
- Schedule control: always-on, manual toggle, date range, week-of-month cycling
- Ordered membership with `sort_order`

### Daily Plan
`GET /users/me/daily-plan?date=YYYY-MM-DD` — assembles everything due for a date:
- Groups items by take window (morning_fasted → bedtime)
- Checks frequency scheduling (daily, EOD, weekly) + protocol schedule gates
- Renders adherence status (taken/skipped/pending)
- Includes nutrition phase, skincare/UV guidance, interaction warnings

### Adherence Tracking
- **Individual**: `POST /users/me/adherence/{type}/{id}` — upsert per item per day
- **Batch**: `POST /users/me/adherence/protocols/{id}` — one tap marks all scheduled items in a protocol
- Snapshots at time of recording: item name, take window, dosage, therapy settings, active regimes
- Idempotent (calling twice updates the existing log, doesn't duplicate)

### Tracking Overview
`GET /users/me/tracking/overview` — completion rates, streaks, per-item stats, AI suggestions

### AI Systems
- **Onboarding** — user names a supplement/medication, Claude generates a structured profile (dosages, interactions, timing, cycling). Dispatched via Celery with in-process fallback.
- **Recommendations** — slot-constrained, goal-aware item selection. User says "give me 3 supplements for longevity" → engine ranks catalog by evidence-based priority, filtered by goals and current stack. Claude-powered with static fallback.
- **Status tracking** — Redis (with in-memory fallback) tracks generation progress per item.

### User Preferences & Interaction Modes
`PUT /users/me/preferences` — stores constraints that drive all AI-assisted features:

| Constraint | Purpose |
|-----------|---------|
| `max_supplements_per_day` | Slot budget for recommendations |
| `max_tablets_per_day` | Form preference (prefers softgels/powders if tablet budget is low) |
| `primary_goals` | Drives recommendation ranking (longevity, cognitive, sleep, etc.) |
| `focus_concerns` | Free-text concerns ("brain fog", "joint pain") shift AI picks |
| `excluded_ingredients` | Allergy/preference exclusions |
| `exercise_blocks_per_week` | Shapes therapy/protocol suggestions |
| `interaction_mode` | Expert / Advanced / Automated / Guided |

**Four interaction modes:**
- **Expert** — full manual control, all parameters exposed
- **Advanced** — AI assists with onboarding and profiles, user drives selection
- **Automated** — AI proposes complete protocols, user approves/tweaks
- **Guided** — wizard Q&A: AI asks constraint questions, builds entire stack

---

## Development

```bash
# Backend
cd apps/api
uv venv && source .venv/bin/activate
uv pip install -e ".[test]"
uvicorn app.main:app --reload --port 8000

# Migrations
alembic revision --autogenerate -m "description"
alembic upgrade head

# Seed data
python -m scripts.seed

# Tests (102 integration tests, SQLite)
pytest

# Frontend
cd apps/mobile && npx expo start

# All services
docker compose up
```

---

## Conventions

- **Settings prefix:** `PROTOCOLS_` (e.g., `PROTOCOLS_DATABASE_URL`, `PROTOCOLS_ANTHROPIC_API_KEY`)
- **Models:** SQLAlchemy 2.0 `Mapped[]` type hints, UUID PKs, `created_at`/`updated_at` timestamps
- **Schemas:** Pydantic v2, `model_config = {"from_attributes": True}`, strict request/response separation
- **Routes:** `APIRouter` with prefix + tags, dependency injection for auth + session, pagination with `has_more`
- **Enums:** `str, enum.Enum` pattern for database-safe string enums
- **AI profiles:** JSONB on catalog rows — generated once per item, shared across all users
- **Serialization:** Dedicated `*_serialization.py` services for complex nested responses
- **Tests:** Integration tests with real SQLite DB, `reset_db` fixture drops/recreates all tables per test
- **Backend patterns match Pempta** (`../vitalsync`): same auth, database, route, and service conventions

---

## API Surface (v1)

| Endpoint Group | Routes |
|---------------|--------|
| Auth | `POST /auth/signup`, `POST /auth/login`, `GET /auth/me`, `PATCH /auth/me` |
| Supplements catalog | `GET /supplements`, `GET /supplements/{id}`, `POST /supplements/onboard` |
| Medications catalog | `GET /medications`, `GET /medications/{id}`, `POST /medications/onboard` |
| Therapies catalog | `GET /therapies`, `GET /therapies/{id}` |
| Peptides catalog | `GET /peptides`, `GET /peptides/{id}` |
| User supplements | `GET/POST /users/me/supplements`, `GET/PATCH/DELETE .../{id}`, `GET .../refill-request` |
| User medications | `GET/POST /users/me/medications`, `GET/PATCH/DELETE .../{id}` |
| User therapies | `GET/POST /users/me/therapies`, `GET/PATCH/DELETE .../{id}` |
| User peptides | `GET/POST /users/me/peptides`, `GET/PATCH/DELETE .../{id}` |
| Protocols | `GET/POST /users/me/protocols`, `GET/PATCH/DELETE .../{id}` |
| Daily plan | `GET /users/me/daily-plan` |
| Adherence | `POST /users/me/adherence/{type}/{id}`, `POST .../protocols/{id}` |
| Tracking | `GET /users/me/tracking/overview` |
| Nutrition | `GET/POST /users/me/nutrition`, `GET/PATCH/DELETE .../{id}` |
| Preferences | `GET/PUT/PATCH /users/me/preferences`, `POST .../recommendations` |
| Exercises catalog | `GET /exercises`, `GET /exercises/{id}`, `POST /exercises` (custom) |
| Workout routines | `GET/POST /users/me/routines`, `GET/PATCH/DELETE .../{id}`, `PUT .../{id}/exercises` |
| Exercise regimes | `GET/POST /users/me/exercise-regimes`, `GET/PATCH/DELETE .../{id}`, `GET .../today` |
| Workout sessions | `GET/POST /users/me/sessions`, `GET/PATCH/DELETE .../{id}`, sets CRUD |
| Exercise stats | `GET /users/me/exercise-stats/overview`, `.../exercise/{id}`, `.../muscle-groups` |
| Gym locations | `GET/POST /users/me/gym-locations`, `PATCH/DELETE .../{id}`, `POST .../match` |

---

## Pempta Integration

Deferred. The architecture accommodates future integration via OAuth + REST API calls to `../vitalsync`, but it is not part of the current build.

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

**Code anchors:** When observing decisions involving code, mention file paths naturally in the description or rationale — noomix extracts them automatically. For richer context, pass the `anchors` parameter: `[{file: "src/foo.ts", symbol: "myFunc", role: "defines config"}]`. Use role verbs like defines, reads, writes, persists, loads, produces, consumes. Noomix auto-generates domain tags from anchor directories and detects dependency chains for impact analysis.

### End of session
Before exiting, call `observe` with a summary of the overall session direction:
- `title`: concise phrase capturing the session theme
- `description`: 1-2 sentences on what was explored or built
- `rationale`: the key reasoning or insight that emerged
- `type`: "milestone" if something shipped, "decision" if a direction was set, "thought" otherwise
<!-- noomix:end -->
