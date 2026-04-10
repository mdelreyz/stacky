# Protocols

Cross-platform health protocol management app — supplements, medications, therapies, peptides, nutrition, and exercise orchestrated into personalized daily plans with AI-powered recommendations, workout tracking, and one-tap adherence logging.

---

## Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | FastAPI (Python 3.12+), async SQLAlchemy 2.0, PostgreSQL, Alembic |
| **Workers** | Celery + Redis (AI profile generation, background tasks) |
| **Frontend** | Expo (React Native) + Expo Router — iOS, Android, Web |
| **Styling** | `StyleSheet.create` + nordic design token system (`Colors.ts`) |
| **AI** | Claude Sonnet via `anthropic` SDK — onboarding, recommendations, guided wizard |
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
      services/         Business logic (19 service modules)
    scripts/            Seed data, catalog definitions
    tests/              102 integration tests
  worker/               Celery task definitions
  mobile/               Expo app (iOS + Android + Web)
    app/
      (tabs)/           5-tab layout: Today, Protocols, Exercise, Nutrition, Profile
      auth/             Login, signup
      supplement/       Catalog detail, add (AI onboard), schedule, refill request
      medication/       Catalog detail, add (AI onboard), schedule
      therapy/          Catalog detail, schedule
      peptide/          Catalog detail, schedule
      user-*/           Manage user instances (dosage, frequency, remove)
      nutrition/        Cycle detail, add
      exercise/         Catalog detail, create custom, stats
      exercise-regime/  Weekly regime detail, create
      workout-routine/  Routine detail, create
      workout-session/  Active session (log sets), start
      gym-location/     GPS location manager
      protocol/         Protocol detail, add
      profile/          Edit, preferences, safety check, location/UV
    components/
      today/            Daily plan cards (window, exercise, nutrition, skincare, interactions, skip modal)
      protocols/        Stack score, catalog, schedule, selection
      exercise/         Search picker, session card, set input
      nutrition/        Plan form
      supplement-detail/ Hero, AI profile, fallback
      forms/            Shared buttons, option grid
      tracking/         Adherence calendar

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
- Today's exercise routine from active regime

### Adherence Tracking
- **Individual**: `POST /users/me/adherence/{type}/{id}` — upsert per item per day
- **Batch**: `POST /users/me/adherence/protocols/{id}` — one tap marks all scheduled items in a protocol
- **Mark all**: batch mark all items in a take window as taken
- Snapshots at time of recording: item name, take window, dosage, therapy settings, active regimes
- Idempotent (calling twice updates the existing log, doesn't duplicate)

### Tracking Overview
`GET /users/me/tracking/overview` — completion rates, streaks, per-item stats

### AI Systems
- **Onboarding** — user names a supplement/medication, Claude generates a structured profile (dosages, interactions, timing, cycling). Dispatched via Celery with in-process fallback.
- **Recommendations** — slot-constrained, goal-aware, synergy-boosted item selection. Claude-powered with full static fallback (longevity essentials + goal-priority tiers).
- **Guided Wizard** — multi-turn conversational protocol builder. Claude asks questions to understand goals and constraints, then proposes a complete stack. Client-managed conversation state with static fallback.
- **Stack Score** — 0-100 composite rating across 5 dimensions (goal coverage 40%, evidence quality 20%, interaction safety 20%, synergy bonus 10%, diversity 10%). 15 known synergy pairs. Contextual improvement suggestions.
- **Interaction Checker** — scans active stack for known contraindications and caution pairs. Severity-ranked warnings (critical/major/moderate/minor).
- **Status tracking** — Redis (with in-memory fallback) tracks AI generation progress per item.

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

### Weather & UV
`services/weather.py` — fetches UV index for user's location to drive skincare/sun guidance on the daily plan.

---

## Design Language

Nordic/glass aesthetic — cool, calm, and elegant:

| Token Group | Direction | Examples |
|---|---|---|
| **Text** | Deep slate, never pure black | `textPrimary: #1a2332`, `textSecondary: #4b5c72` |
| **Surfaces** | Cloud white, frosted glass | `background: #f9fafb`, `surface: #e6ecf2` |
| **Primary** | Steel blue | `primary: #5a8ab5` |
| **Success** | Scandinavian sage | `success: #4a8a6a` |
| **Danger** | Dusty rose | `danger: #c45858` |
| **Warning** | Nordic gold | `warning: #b88a35` |
| **Accent** | Twilight lavender | `accent: #6858a5` |
| **Borders** | Frost lines, barely visible | `border: #d8e0e8` |
| **Neutrals** | Cool-toned slate | `gray: #6a7888`, `black: #101820` |

All colors live in `Colors.ts`. Zero hardcoded hex values in any component or screen file. Muscle group chart has its own desaturated spectrum. Every `Pressable` element has `accessibilityRole` + `accessibilityLabel`.

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
- **Design tokens:** All colors in `Colors.ts`, referenced via `colors.tokenName`. Never hardcode hex values.
- **Accessibility:** Every `Pressable` gets `accessibilityRole` (button/checkbox/radio/switch) + `accessibilityLabel` + `accessibilityState` where applicable
- **Security:** Rate limiting on auth (slowapi), bcrypt max_length guard, IDOR-safe ownership checks on all user resources, sessionStorage on web (not localStorage)
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
| Preferences | `GET/PUT/PATCH /users/me/preferences` |
| Recommendations | `POST /users/me/preferences/recommendations`, `POST .../recommendations/apply` |
| Stack score | `GET /users/me/preferences/stack-score` |
| Interactions | `GET /users/me/preferences/interactions` |
| Guided wizard | `POST /users/me/preferences/wizard` |
| Exercises catalog | `GET /exercises`, `GET /exercises/{id}`, `POST /exercises` (custom) |
| Workout routines | `GET/POST /users/me/routines`, `GET/PATCH/DELETE .../{id}`, `PUT .../{id}/exercises` |
| Exercise regimes | `GET/POST /users/me/exercise-regimes`, `GET/PATCH/DELETE .../{id}`, `GET .../today` |
| Workout sessions | `GET/POST /users/me/sessions`, `GET/PATCH/DELETE .../{id}`, sets CRUD |
| Exercise stats | `GET /users/me/exercise-stats/overview`, `.../exercise/{id}`, `.../muscle-groups` |
| Gym locations | `GET/POST /users/me/gym-locations`, `PATCH/DELETE .../{id}`, `POST .../match` |

---

## Services

| Service | File | Purpose |
|---------|------|---------|
| Daily Plan | `daily_plan.py` | Assembles daily plan with frequency/schedule gates, window grouping |
| AI Onboarding | `ai_onboarding.py` | Claude-powered profile generation for supplements/medications |
| Recommendations | `recommendation_engine.py` | Goal-aware, synergy-boosted item selection with static fallback |
| Guided Wizard | `guided_wizard.py` | Multi-turn conversational protocol builder |
| Stack Score | `stack_score.py` | 5-dimension composite score with synergy detection |
| Interactions | `interaction_checker.py` | Scans stack for contraindications and caution pairs |
| Tracking | `tracking.py` | Completion rates, streaks, per-item adherence stats |
| Exercise Stats | `exercise_stats.py` | Volume, max weight, 1RM estimates, muscle distribution |
| Gym Geofence | `gym_geofence.py` | GPS location matching for auto-loading routines |
| Weather/UV | `weather.py` | UV index fetch for skincare guidance |
| Nutrition | `nutrition_cycles.py` | Phase management, macro computation |
| Protocol Schedule | `protocol_schedule.py` | Schedule gate logic (date range, week-of-month, manual) |
| Regimen Schedule | `regimen_schedule.py` | Supplement cycling/regimen schedule |
| Pagination | `pagination.py` | Shared paginated response helper |
| Serialization | `user_*_serialization.py` | Nested response builders (4 files, one per user item type) |

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
