# Protocols — Refactoring Plan

> **Last scan: 2026-04-10** | Codebase: ~37,000 lines | 102 tests passing
> This is a living document. Run `/refactor` to refresh.

## Health Summary

| Dimension | Status | Findings |
|-----------|--------|----------|
| File Size & Structure | :warning: | 4 files need splitting (500+ lines), 8 in watch zone |
| Dead Code | :warning: | Broken migration, orphaned api-client package, 8 unused imports |
| Duplication | :warning: | 4 near-identical user item routes, duplicated adherence dispatch in index.tsx |
| Security | :x: | CRITICAL: IDOR on workout sets; HIGH: insecure JWT default, no rate limiting |
| Documentation | :warning: | CLAUDE.md stale (test/model/router counts, missing exercise pillar) |
| UI & Design | :warning: | 91 hardcoded hex colors, zero accessibility labels on 302 pressables |
| Robustness | :x: | CRITICAL: IDOR; HIGH: non-atomic batch adherence |
| Pipeline & Cache | :warning: | Celery result_expires missing, in-memory cache unbounded |
| Undefined Names | :x: | 26 undefined names in first migration (will crash on run) |

---

## Critical Issues

> These MUST be fixed before any further feature work.

### C-1: IDOR — WorkoutSet update/delete bypasses ownership
- **Severity:** CRITICAL
- **Dimensions:** Security (4), Robustness (7)
- **Location:** `apps/api/app/routes/workout_sessions.py:268,296`
- **Problem:** `update_set` and `delete_set` verify session ownership but query `WorkoutSet` by `set_id` alone with no join through `WorkoutSessionExercise.session_id`. Any authenticated user can modify/delete another user's sets.
- **Fix:** Replace bare `WorkoutSet` query with a joined query constraining through the verified session.

### C-2: Broken migration — 26 undefined names
- **Severity:** CRITICAL
- **Dimensions:** Dead Code (2), Compile (9)
- **Location:** `apps/api/migrations/versions/e5e80fb951ad_add_user_preferences_and_peptide_tables.py`
- **Problem:** References `app.database.UUID(length=32)` (never imported) and bare `Text()` (not imported) throughout. Will crash on `alembic upgrade`.
- **Fix:** Add `from app.database import UUID` and replace `Text()` with `sa.Text()`, or squash with the second migration.

---

## High Issues

> Fix in this session.

### H-1: JWT secret has insecure fallback default
- **Severity:** HIGH
- **Dimension:** Security (4)
- **Location:** `apps/api/app/config.py:16`
- **Problem:** `jwt_secret_key: str = "change-me-in-production"` — if env var is unset, server runs with known key.
- **Fix:** Remove default value so server fails to start without it.

### H-2: Rate limiting configured but never enforced
- **Severity:** HIGH
- **Dimension:** Security (4)
- **Location:** `apps/api/app/main.py` (missing middleware)
- **Problem:** `rate_limit_auth` exists in config but no limiter middleware is mounted.
- **Fix:** Install and mount `slowapi`, apply to `/auth/login` and `/auth/signup`.

### H-3: Token stored in localStorage on web
- **Severity:** HIGH
- **Dimension:** Security (4)
- **Location:** `apps/mobile/lib/token-store.ts:8,15`
- **Problem:** JWT in `localStorage` is vulnerable to XSS. Server already sets HttpOnly cookie.
- **Fix:** Use `sessionStorage` at minimum, or rely on the HttpOnly cookie for web.

### H-4: Non-atomic batch adherence
- **Severity:** HIGH
- **Dimension:** Robustness (7)
- **Location:** `apps/api/app/routes/adherence.py:91,380-427`
- **Problem:** `_upsert_adherence` calls `session.commit()` per item inside a loop. Partial failures leave protocol in half-marked state.
- **Fix:** Use `session.flush()` per item, single `session.commit()` at end with rollback on error.

### H-5: CLAUDE.md stale counts
- **Severity:** HIGH
- **Dimension:** Documentation (5)
- **Location:** `CLAUDE.md:26,27,31,128`
- **Problem:** Claims 56 tests (actual: 102), 16 models (actual: 23), 16 routers (actual: 22).
- **Fix:** Update all three counts.

### H-6: Unused imports across backend
- **Severity:** HIGH
- **Dimension:** Dead Code (2)
- **Locations:** `exercise_stats.py`, `recommendation_engine.py`, `guided_wizard.py`, `stack_score.py`
- **Fix:** Run `ruff check --fix --select F401 apps/api/`

---

## Medium Issues

> Fix when touching related code.

| # | File | Issue | Dimension |
|---|------|-------|-----------|
| M-1 | `routes/user_{supplements,medications,peptides,therapies}.py` | 4 near-identical CRUD files (~420 duplicated lines) | Duplication |
| M-2 | `app/(tabs)/index.tsx:118-194` | Adherence dispatch block duplicated verbatim | Duplication |
| M-3 | `app/peptide/[id].tsx`, `therapy/[id].tsx`, `medication/[id].tsx` | Near-duplicate detail screens | Duplication |
| M-4 | `constants/Colors.ts` | 91 hardcoded hex values across 22 files | UI |
| M-5 | `NutritionPhaseCard.tsx` | All 8 style values hardcoded | UI |
| M-6 | `SkincareGuidanceCard.tsx` | Full amber palette hardcoded (7 values) | UI |
| M-7 | `TrackingSummaryCard.tsx` | Blue-tint card palette hardcoded (7 values) | UI |
| M-8 | All mobile `.tsx` | Zero `accessibilityLabel` on 302 Pressable elements | UI |
| M-9 | `CLAUDE.md:154-172` | API Surface table missing 6 exercise endpoint groups | Docs |
| M-10 | `CLAUDE.md:14` | Styling says NativeWind; app uses `StyleSheet.create` | Docs |
| M-11 | `CLAUDE.md:44-52` | Domain Pillars table missing Exercise pillar | Docs |
| M-12 | `celery_app.py:21-27` | `result_expires` not set | Pipeline |
| M-13 | `main.py:32-38` | CORS allow_credentials with no wildcard guard | Security |
| M-14 | `routes/supplements.py:84`, `medications.py:82` | Any user can create shared catalog entries | Security |
| M-15 | `services/stack_score.py:169` | Unused variable `relevant_goal_tags` | Dead Code |
| M-16 | `packages/api-client/` | Entire package unused — zero consumers | Dead Code |
| M-17 | Root `package.json` | `puppeteer` dependency unused | Dead Code |
| M-18 | `DailyPlanWindowCard.tsx:23-31` | `handleMarkAll` swallows errors silently | Robustness |
| M-19 | `therapy/[id].tsx:57` | "Protocol not found" — wrong entity label | Robustness |
| M-20 | `InteractionWarningsCard.tsx:45-68` | Border/text tones escape danger token | UI |
| M-21 | `CycleAlertsCard.tsx:30-55` | Entire purple palette hardcoded | UI |

---

## Low Issues & Watch List

| # | File | Issue | Dimension |
|---|------|-------|-----------|
| L-1 | `config.py:9` | Hardcoded dev DB credentials as default | Security |
| L-2 | `schemas/auth.py:31` | No password max_length (bcrypt DoS) | Security |
| L-3 | `jwt.py:15,74` | In-memory token revocation is process-scoped | Security |
| L-4 | `ai_onboarding.py:23` | In-memory status cache has no active eviction | Pipeline |
| L-5 | `peptide/[id].tsx`, `therapy/[id].tsx` | Exact copy of readString/readStringArray helpers | Duplication |
| L-6 | `adherence.py:142,246,292` | Unguarded float(None) on nullable dosage | Robustness |
| L-7 | `guided_wizard.py:161` | Silent except: pass lacks comment | Dead Code |
| L-8 | `StackScoreCard.tsx:12` | Score color function returns hardcoded hex | UI |

---

## File Size Hotspots

| File | Lines | Status | Action |
|------|:-----:|--------|--------|
| `scripts/seed_supplement_catalog.py` | 1386 | Data-exempt | No action |
| `scripts/seed.py` | 1259 | Data-exempt | No action |
| `scripts/seed_exercise_catalog.py` | 828 | Data-exempt | No action |
| `packages/api-client/src/client.ts` | 742 | Split soon | God object (35 methods). Deprecate or split |
| `routes/user_preferences.py` | 614 | Split soon | Extract apply_recommendations to service |
| `app/wizard.tsx` | 483 | Split soon | Extract WizardResultCard, WizardWelcome |
| `app/recommendations.tsx` | 476 | Split soon | Move RecommendationCard to own file |
| `app/profile/preferences.tsx` | 464 | Watch | Extract NumberField; consolidate form state |
| `routes/adherence.py` | 447 | Watch | Extract commit logic to service |
| `services/daily_plan.py` | 428 | Watch | Extract _item_to_plan_entry helper |
| `services/ai_onboarding.py` | 425 | Watch | Deduplicate supplement/medication paths |
| `NutritionPlanForm.tsx` | 399 | Watch | Remove duplicate OptionGrid; extract MacroSelector |
| `(tabs)/exercise.tsx` | 389 | Watch | Extract sections on next feature add |

---

## History

| Date | Action |
|------|--------|
| 2026-04-10 | Full scan — 9 dimensions, 6 parallel agents. Found 2 CRITICAL, 6 HIGH, 21 MEDIUM, 8 LOW issues. |
