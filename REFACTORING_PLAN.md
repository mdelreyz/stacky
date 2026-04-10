# Protocols — Refactoring Plan

> **Last scan: 2026-04-10** | **Updated: 2026-04-10** | Codebase: ~37,000 lines | 102 tests passing
> This is a living document. Run `/refactor` to refresh.

## Health Summary

| Dimension | Status | Findings |
|-----------|--------|----------|
| File Size & Structure | :warning: | 4 files need splitting (500+ lines), 8 in watch zone |
| Dead Code | :white_check_mark: | ~~Broken migration~~ Fixed. Orphaned api-client (intentionally kept). ~~8 unused imports~~ Fixed. |
| Duplication | :warning: | 4 near-identical user item routes |
| Security | :white_check_mark: | ~~IDOR~~ Fixed. ~~No rate limiting~~ Fixed (slowapi on auth). ~~bcrypt DoS~~ Fixed (max_length). JWT default has prod guard. |
| Documentation | :white_check_mark: | ~~CLAUDE.md stale~~ Updated. |
| UI & Design | :warning: | 91 hardcoded hex colors, zero accessibility labels on 302 pressables |
| Robustness | :white_check_mark: | ~~IDOR~~ Fixed. ~~Non-atomic batch adherence~~ Fixed. ~~Wrong entity labels~~ Fixed. |
| Pipeline & Cache | :white_check_mark: | ~~Celery result_expires~~ Fixed (1h TTL). In-memory cache unbounded (low risk). |
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
| M-1 | `routes/user_{supplements,medications,peptides,therapies}.py` | 4 near-identical CRUD files (~420 duplicated lines) | Duplication | Open |
| M-2 | `app/(tabs)/index.tsx:118-194` | Adherence dispatch uses lookup table (not duplication) | Duplication | Non-issue |
| M-3 | `app/peptide/[id].tsx`, `therapy/[id].tsx`, `medication/[id].tsx` | Near-duplicate detail screens | Duplication | Open |
| M-4 | `constants/Colors.ts` | 91 hardcoded hex values across 22 files | UI | Open |
| M-5 | `NutritionPhaseCard.tsx` | All 8 style values hardcoded | UI | Open |
| M-6 | `SkincareGuidanceCard.tsx` | Full amber palette hardcoded (7 values) | UI | Open |
| M-7 | `TrackingSummaryCard.tsx` | Blue-tint card palette hardcoded (7 values) | UI | Open |
| M-8 | All mobile `.tsx` | Zero `accessibilityLabel` on 302 Pressable elements | UI | Open |
| M-9 | `CLAUDE.md:154-172` | ~~API Surface table missing exercise endpoint groups~~ | Docs | **Fixed** |
| M-10 | `CLAUDE.md:14` | ~~Styling says NativeWind~~ | Docs | **Fixed** |
| M-11 | `CLAUDE.md:44-52` | ~~Domain Pillars table missing Exercise pillar~~ | Docs | **Fixed** |
| M-12 | `celery_app.py:21-27` | ~~`result_expires` not set~~ | Pipeline | **Fixed** |
| M-13 | `main.py:32-38` | CORS allow_credentials — origins are explicit, not wildcard | Security | Non-issue |
| M-14 | `routes/supplements.py:84`, `medications.py:82` | Any user can create shared catalog entries | Security | Open |
| M-15 | `services/stack_score.py:169` | ~~Unused variable `relevant_goal_tags`~~ | Dead Code | **Fixed** |
| M-16 | `packages/api-client/` | Unused package — intentionally kept for future use | Dead Code | Deferred |
| M-17 | Root `package.json` | `puppeteer` dependency unused | Dead Code | Open |
| M-18 | `DailyPlanWindowCard.tsx:23-31` | `handleMarkAll` — parent already catches errors | Robustness | Non-issue |
| M-19 | `therapy/[id].tsx:57` | ~~"Protocol not found" — wrong entity label~~ | Robustness | **Fixed** |
| M-20 | `InteractionWarningsCard.tsx:45-68` | Border/text tones escape danger token | UI | Open |
| M-21 | `CycleAlertsCard.tsx:30-55` | Entire purple palette hardcoded | UI | Open |

---

## Low Issues & Watch List

| # | File | Issue | Dimension | Status |
|---|------|-------|-----------|--------|
| L-1 | `config.py:9` | Hardcoded dev DB credentials as default | Security | Open |
| L-2 | `schemas/auth.py:31` | ~~No password max_length (bcrypt DoS)~~ | Security | **Fixed** |
| L-3 | `jwt.py:15,74` | In-memory token revocation is process-scoped | Security | Open |
| L-4 | `ai_onboarding.py:23` | In-memory status cache has no active eviction | Pipeline | Open |
| L-5 | `peptide/[id].tsx`, `therapy/[id].tsx` | Exact copy of readString/readStringArray helpers | Duplication | Open |
| L-6 | `adherence.py:142,246,292` | `dosage_amount` is NOT NULL — float(None) impossible | Robustness | Non-issue |
| L-7 | `guided_wizard.py:161` | Silent except: pass lacks comment | Dead Code | Open |
| L-8 | `StackScoreCard.tsx:12` | Score color function returns hardcoded hex | UI | Open |

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
| 2026-04-10 | Fixed all CRITICAL (2/2) and HIGH (6/6) issues. Fixed 6 MEDIUM and 2 LOW. 4 MEDIUM re-classified as non-issues. |
