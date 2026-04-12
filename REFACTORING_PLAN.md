# Protocols — Refactoring Plan

> **Last scan: 2026-04-12** | **Updated: 2026-04-12** | Codebase: ~195,700 lines | Verification: targeted backend pytest + mobile typecheck green
> This is a living document. Run `/refactor` to refresh.

## Health Summary

| Dimension | Status | Findings |
|-----------|--------|----------|
| File Size & Structure | :warning: | No oversized mobile routes remain. Remaining split-soon files are `packages/api-client/src/client.ts` and `apps/api/app/services/notifications.py`; several 445-517 line backend/mobile files remain in watch zone. |
| Dead Code | :white_check_mark: | ~~Broken migration~~ Fixed. Orphaned api-client (intentionally kept). ~~8 unused imports~~ Fixed. |
| Duplication | :white_check_mark: | ~~4 near-identical user item routes~~ Fixed. ~~Near-duplicate medication/therapy/peptide detail screens~~ Fixed. |
| Security | :white_check_mark: | ~~IDOR~~ Fixed. ~~No rate limiting~~ Fixed (slowapi on auth). ~~bcrypt DoS~~ Fixed (max_length). JWT default has prod guard. Revocation fallback is now durable when Redis is down. |
| Documentation | :white_check_mark: | ~~CLAUDE.md stale~~ Updated. |
| UI & Design | :white_check_mark: | ~~91 hardcoded hex colors~~ Fixed. ~~302 unlabeled Pressables~~ Fixed. ~~Muscle chart hex~~ Fixed. Premium glass UI system now spans the full product surface, and all mobile routes are back under the 500-line split threshold. |
| Robustness | :white_check_mark: | ~~IDOR~~ Fixed. ~~Non-atomic batch adherence~~ Fixed. ~~Wrong entity labels~~ Fixed. ~~Weather silent exception~~ Fixed. |
| Pipeline & Cache | :white_check_mark: | ~~Celery result_expires~~ Fixed (1h TTL). ~~In-memory status cache unbounded~~ Fixed (TTL pruning + 1024-entry cap). |
| Undefined Names | :white_check_mark: | ~~26 undefined names~~ Fixed. |

---

## Critical Issues — ALL RESOLVED

### C-1: ~~IDOR — WorkoutSet update/delete bypasses ownership~~ FIXED
- **Resolution:** Added joined query through `WorkoutSessionExercise.session_id` in both `update_set` and `delete_set`.

### C-2: ~~Broken migration — 26 undefined names~~ FIXED
- **Resolution:** Added `from app.database import UUID` import, replaced `Text()` with `sa.Text()`.

---

## High Issues — ALL RESOLVED

### H-1: ~~JWT secret has insecure fallback default~~ MITIGATED
- **Resolution:** `config.py` already has `_check_insecure_defaults()` which raises `RuntimeError` in production. Dev-friendly default is intentional.

### H-2: ~~Rate limiting configured but never enforced~~ FIXED
- **Resolution:** Mounted `slowapi` limiter via `app/rate_limit.py`. Applied `@limiter.limit(settings.rate_limit_auth)` to `/auth/signup` and `/auth/login` (10/minute).

### H-3: ~~Token stored in localStorage on web~~ FIXED
- **Resolution:** Changed `token-store.ts` from `localStorage` to `sessionStorage` on web platform.

### H-4: ~~Non-atomic batch adherence~~ FIXED
- **Resolution:** Changed `_upsert_adherence` from `commit()` to `flush()`. Single atomic `commit()` at end of each endpoint.

### H-5: ~~CLAUDE.md stale counts~~ FIXED
- **Resolution:** Updated model/router/test counts, added exercise pillar, corrected styling reference.

### H-6: ~~Unused imports across backend~~ FIXED
- **Resolution:** Ran `ruff check --fix --select F401` to remove all unused imports.

---

## Medium Issues

> Fix when touching related code.

| # | File | Issue | Dimension | Status |
|---|------|-------|-----------|--------|
| M-1 | `routes/user_{supplements,medications,peptides,therapies}.py` | ~~4 near-identical CRUD files (~420 duplicated lines)~~ | Duplication | **Fixed** |
| M-2 | `app/(tabs)/index.tsx:118-194` | Adherence dispatch uses lookup table (not duplication) | Duplication | Non-issue |
| M-3 | `app/peptide/[id].tsx`, `therapy/[id].tsx`, `medication/[id].tsx` | ~~Near-duplicate detail screens~~ | Duplication | **Fixed** |
| M-4 | `constants/Colors.ts` | ~~91 hardcoded hex values across 22 files~~ | UI | **Fixed** |
| M-5 | `NutritionPhaseCard.tsx` | ~~All 8 style values hardcoded~~ | UI | **Fixed** |
| M-6 | `SkincareGuidanceCard.tsx` | ~~Full amber palette hardcoded (7 values)~~ | UI | **Fixed** |
| M-7 | `TrackingSummaryCard.tsx` | ~~Blue-tint card palette hardcoded (7 values)~~ | UI | **Fixed** |
| M-8 | All mobile `.tsx` | ~~Zero `accessibilityLabel` on 302 Pressable elements~~ | UI | **Fixed** |
| M-9 | `CLAUDE.md:154-172` | ~~API Surface table missing exercise endpoint groups~~ | Docs | **Fixed** |
| M-10 | `CLAUDE.md:14` | ~~Styling says NativeWind~~ | Docs | **Fixed** |
| M-11 | `CLAUDE.md:44-52` | ~~Domain Pillars table missing Exercise pillar~~ | Docs | **Fixed** |
| M-12 | `celery_app.py:21-27` | ~~`result_expires` not set~~ | Pipeline | **Fixed** |
| M-13 | `main.py:32-38` | CORS allow_credentials — origins are explicit, not wildcard | Security | Non-issue |
| M-14 | `routes/supplements.py:84`, `medications.py:82` | ~~Any user can create shared catalog entries~~ | Security | **Fixed** |
| M-15 | `services/stack_score.py:169` | ~~Unused variable `relevant_goal_tags`~~ | Dead Code | **Fixed** |
| M-16 | `packages/api-client/` | Unused package — intentionally kept for future use | Dead Code | Deferred |
| M-17 | Root `package.json` | `puppeteer` is used by `docs/generate-pdf.mjs` | Dead Code | Non-issue |
| M-18 | `DailyPlanWindowCard.tsx:23-31` | `handleMarkAll` — parent already catches errors | Robustness | Non-issue |
| M-19 | `therapy/[id].tsx:57` | ~~"Protocol not found" — wrong entity label~~ | Robustness | **Fixed** |
| M-20 | `InteractionWarningsCard.tsx:45-68` | ~~Border/text tones escape danger token~~ | UI | **Fixed** |
| M-21 | `CycleAlertsCard.tsx:30-55` | ~~Entire purple palette hardcoded~~ | UI | **Fixed** |
| M-22 | `exercise/stats.tsx:36-50` | ~~13 hardcoded hex colors in muscle-group chart map~~ | UI | **Fixed** |
| M-23 | `app/recommendations.tsx`, `app/wizard.tsx`, `app/tracking.tsx` | ~~Secondary high-traffic screens still use flatter legacy cards instead of the new ambient/glass system~~ | UI | **Fixed** |
| M-24 | `app/{medication,therapy,peptide}/[id]/schedule.tsx`, `app/{medication,nutrition}/add.tsx`, `app/protocol/[id].tsx`, `app/user-supplement/[id].tsx`, `app/supplement/[id]/schedule.tsx`, `app/supplement/refill-request.tsx` | ~~Remaining schedule/create utility routes still need the same ambient shell and glass treatment used across the main product surfaces~~ | UI | **Fixed** |
| M-25 | `apps/api/data/manual_catalog_profiles.json`, `supplements`, `medications`, `therapies`, `peptides` | 112 non-plain catalog rows are still parked in `supplements`; mirror-first migration is started and seed-reproducible, but the broader candidate set still needs canonicalization and rollout | Data Model | Open |

---

## Low Issues & Watch List

| # | File | Issue | Dimension | Status |
|---|------|-------|-----------|--------|
| L-1 | `config.py:9` | ~~Hardcoded dev DB credentials as default~~ | Security | **Fixed** |
| L-2 | `schemas/auth.py:31` | ~~No password max_length (bcrypt DoS)~~ | Security | **Fixed** |
| L-3 | `jwt.py:15,74` | ~~In-memory token revocation is process-scoped~~ | Security | **Fixed** |
| L-4 | `ai_onboarding.py:23` | ~~In-memory status cache has no active eviction~~ | Pipeline | **Fixed** |
| L-5 | `peptide/[id].tsx`, `therapy/[id].tsx` | ~~Exact copy of readString/readStringArray helpers~~ | Duplication | **Fixed** |
| L-6 | `adherence.py:142,246,292` | `dosage_amount` is NOT NULL — float(None) impossible | Robustness | Non-issue |
| L-7 | `guided_wizard.py:161` | ~~Silent except: pass lacks comment~~ | Dead Code | **Fixed** |
| L-8 | `StackScoreCard.tsx:12` | ~~Score color function returns hardcoded hex~~ | UI | **Fixed** |
| L-9 | `services/weather.py:27` | ~~Silent `except Exception: return None` without logging~~ | Robustness | **Fixed** |
| L-10 | `app/(tabs)/exercise.tsx:35-38` | Inner `.catch()` in Promise.all provides graceful degradation | Robustness | Non-issue |

---

## File Size Hotspots

| File | Lines | Status | Action |
|------|:-----:|--------|--------|
| `scripts/seed_supplement_catalog.py` | 1386 | Data-exempt | No action |
| `scripts/seed.py` | 1259 | Data-exempt | No action |
| `scripts/seed_exercise_catalog.py` | 828 | Data-exempt | No action |
| `packages/api-client/src/client.ts` | 813 | Split soon | God object (35 methods). Deprecate or split |
| `apps/api/app/services/notifications.py` | 609 | Split soon | Extract delivery orchestration and provider/recording helpers |
| `apps/api/app/routes/user_preferences.py` | 517 | Watch | Recommendation apply workflow is extracted; monitor remaining route breadth |
| `app/profile/preferences.tsx` | 472 | Watch | NumberField extracted; consolidate remaining form state later |
| `app/tracking.tsx` | 470 | Watch | Split summary and history sections if the feature surface grows again |
| `app/peptide/add.tsx` | 467 | Watch | Mirror the smaller create-flow extraction pattern used elsewhere if it expands |
| `apps/api/app/services/guided_wizard_fallback.py` | 463 | Watch | Heuristic fallback flow is isolated now; monitor before splitting further |
| `routes/adherence.py` | 453 | Watch | Extract commit logic to service |
| `app/therapy/add.tsx` | 450 | Watch | Create-flow is under threshold but still worth monitoring for new duplication |
| `app/protocol-templates.tsx` | 447 | Watch | Extract filter/result sections if more template actions land |
| `components/nutrition/NutritionPlanForm.tsx` | 445 | Watch | Remove duplicate OptionGrid; extract MacroSelector |
| `apps/api/app/routes/protocols.py` | 445 | Watch | Extract protocol item assembly/validation helpers |
| `services/daily_plan.py` | 428 | Watch | Extract _item_to_plan_entry helper |
| `app/exercise/stats.tsx` | 425 | Watch | Extract chart and summary card sections |
| `services/recommendation_engine.py` | 424 | Watch | Separate catalog normalization from ranking logic |
| `app/recommendations.tsx` | 404 | Watch | RecommendationCard extracted; monitor remaining screen orchestration |

---

## History

| Date | Action |
|------|--------|
| 2026-04-10 | Full scan — 9 dimensions, 6 parallel agents. Found 2 CRITICAL, 6 HIGH, 21 MEDIUM, 8 LOW issues. |
| 2026-04-10 | Fixed all CRITICAL (2/2) and HIGH (6/6) issues. Fixed 6 MEDIUM and 2 LOW. 4 MEDIUM re-classified as non-issues. |
| 2026-04-10 | Color consolidation: 91 → 0 hardcoded hex colors. 25 semantic tokens added to Colors.ts. 23 component files updated. |
| 2026-04-10 | Second scan (6 agents): dead code clean, security clean, pipeline clean. Only remaining HIGH: accessibility labels. |
| 2026-04-10 | Accessibility labels: 302/302 Pressable elements labeled across 50 .tsx files. All HIGH issues now resolved. |
| 2026-04-10 | Third scan (5 agents): all clean. Fixed M-22 muscle-group hex colors, L-9 weather.py silent exception. No CRITICAL/HIGH found. |
| 2026-04-10 | Premium UI execution pass: web shell, auth, all top-level tabs, shared form primitives, protocol creation, supplement add/detail, and today/protocol cards were upgraded to the ambient glass visual system. Logged remaining legacy secondary screens as M-23 and M-24. |
| 2026-04-10 | Follow-up UI pass: recommendations, wizard, tracking, profile settings, the full exercise/workout flow, nutrition manage, and medication/therapy/peptide detail/manage screens were upgraded to the ambient glass system. M-23 closed and M-24 narrowed to the remaining schedule/create utility routes. |
| 2026-04-10 | Final UI cleanup pass: remaining schedule/create/manage utility routes were moved onto the shared ambient shell, refill-note and medication onboarding were polished, and M-24 closed. |
| 2026-04-10 | Refactor hygiene pass: verified `puppeteer` is still required by `docs/generate-pdf.mjs` and extracted shared AI-profile readers into `apps/mobile/lib/ai-profile.ts`, closing L-5 and marking M-17 as a non-issue. |
| 2026-04-10 | Manual supplement catalog curation reached 305/305 local profiles. Added `CATALOG_MODALITY_AUDIT.md`, `apps/api/data/catalog_modality_mirrors.json`, and `apps/api/scripts/apply_catalog_modality_mirrors.py`; opened M-25 to track mirror-first migration of medication-, therapy-, and peptide-like rows currently living in `supplements`. Seeded the first local mirror batch into `medications`, `therapies`, and `peptides`. |
| 2026-04-10 | Structural backend refactor: extracted `apps/api/app/services/user_item_crud.py` and collapsed the duplicated user supplement/medication/therapy/peptide route workflow onto it, closing M-1. Verified with 34 targeted backend tests. |
| 2026-04-10 | Mobile duplication refactor: extracted `CatalogDetailScaffold`, `catalogDetailStyles`, and `useCatalogItemDetail` to remove the near-duplicate medication/therapy/peptide detail screens, closing M-3. Verified with `npx tsc -p apps/mobile/tsconfig.json --noEmit`. |
| 2026-04-10 | Robustness/reproducibility cleanup: added active pruning and capacity limits to the in-memory AI onboarding status cache, closing L-4, and wired `scripts.seed.py` to replay repo-backed manual catalog profiles plus approved catalog mirrors during seeding. |
| 2026-04-11 | Configuration hardening: switched the default backend database URL to the repo-local SQLite database, updated `.env.example` to describe Postgres as an explicit override instead of the default, and removed the same hardcoded development credential from `apps/api/alembic.ini`, closing L-1. |
| 2026-04-11 | Auth hardening: added a `revoked_tokens` table and moved JWT revocation fallback from Redis-only plus process memory to Redis-primary, database-secondary, memory-tertiary behavior, closing L-3. Verified with targeted JWT/auth/config tests and a migration. |
| 2026-04-11 | Hotspot cleanup: extracted `app/services/recommendation_application.py` from `routes/user_preferences.py`, split `apps/mobile/app/wizard.tsx` into `WizardWelcomeCard` and `WizardResultCard`, and moved the recommendation item surface into `components/recommendations/RecommendationCard.tsx`. Verified with 126 passing backend tests and `npx tsc -p apps/mobile/tsconfig.json --noEmit`. |
| 2026-04-11 | Follow-up hotspot cleanup: extracted `components/profile/NumberField.tsx`, bringing `app/profile/preferences.tsx` back under 500 lines. The remaining split-soon list is now down to `api-client/src/client.ts`, `services/ai_onboarding.py`, and `app/(tabs)/exercise.tsx`, plus the open catalog-modality migration tracked in M-25. |
| 2026-04-11 | Backend AI refactor: split prompt/schema/generation logic into `services/ai_profile_generation.py` and collapsed supplement/medication onboarding onto a shared runner in `services/ai_onboarding.py`, bringing `ai_onboarding.py` under 300 lines. Verified with targeted onboarding/supplement/auth/config tests. |
| 2026-04-11 | Exercise tab refactor: split `app/(tabs)/exercise.tsx` into `components/exercise/ExerciseHero.tsx`, `ExerciseRoutinesSection.tsx`, `ExerciseRecentSessionsSection.tsx`, and `ExerciseNavLinksSection.tsx`, bringing the main tab file under 300 lines. Verified with `npx tsc -p apps/mobile/tsconfig.json --noEmit`. |
| 2026-04-11 | Size scan refresh: after the AI onboarding and Exercise splits, the true split-soon list shifted to `client.ts`, `guided_wizard.py`, `workout-routine/create.tsx`, and `(tabs)/protocols.tsx`. The catalog modality migration in M-25 remains the main non-structural backlog item. |
| 2026-04-11 | Guided wizard refactor: split `services/guided_wizard.py` into `guided_wizard_prompting.py`, `guided_wizard_fallback.py`, and `guided_wizard_types.py`, reducing the public orchestration file to 103 lines while preserving the existing route contract and fallback behavior. Verified with `./apps/api/.venv/bin/pytest apps/api/tests/test_wizard.py` (7 passed). |
| 2026-04-12 | Protocol completion + refactor pass: added cross-pillar Protocols search, month-to-date digest comparison, and global unauthorized-session handling for expired mobile auth. Verified with `pytest tests/test_tracking.py tests/test_weekly_digest.py` (16 passed) and `npx tsc --noEmit -p apps/mobile/tsconfig.json`. |
| 2026-04-12 | Mobile hotspot cleanup: split `app/(tabs)/protocols.tsx`, `app/onboarding.tsx`, `app/supplement/add.tsx`, `app/weekly-digest.tsx`, `app/profile/notifications.tsx`, `app/health-journal.tsx`, and `app/workout-routine/create.tsx` into focused hooks, styles, and section components. Largest mobile route is now `app/profile/preferences.tsx` at 472 lines; no 500+ mobile routes remain. |
