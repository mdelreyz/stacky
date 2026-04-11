# Protocols — Development Plan

Last updated: 2026-04-11

---

## Overall Dimensions

| Metric | Count |
|--------|-------|
| Backend endpoints | 120 across 28 route files |
| SQLAlchemy models | 22 with 54 relationships |
| Pydantic schemas | 132 classes across 18 files |
| Services | 32 business logic modules |
| API tests | 208 across 31 test files |
| Alembic migrations | 7 |
| Seed scripts | 8 |
| Mobile screens | 55 |
| Mobile components | 61 |
| API client modules | 26 |
| Lib utilities | 16 |
| Domain types | 150 exported interfaces/types |
| Design tokens | 58 color tokens |
| Stack.Screen registrations | 51 (all screens registered) |

---

## Domain Pillar Completeness

| Pillar | Catalog | User CRUD | Schedule Form | Detail | Add | Manage | Tests | Status |
|--------|---------|-----------|---------------|--------|-----|--------|-------|--------|
| Supplements | Full (taxonomy, AI profiles, onboarding) | Full (add/update/remove/refill) | SupplementScheduleForm | supplement/[id] | supplement/add | user-supplement/[id] | 13 | Complete |
| Medications | Full (categories, AI profiles, onboarding) | Full (add/update/remove) | DoseScheduleForm (shared) | medication/[id] | medication/add | user-medication/[id] | 3 | Complete |
| Therapies | Full (categories, settings JSON) | Full (add/update/remove) | TherapyScheduleForm | therapy/[id] | therapy/add | user-therapy/[id] | 3 | Complete |
| Peptides | Full (categories, goals, AI profile) | Full (add/update/remove) | PeptideScheduleForm | peptide/[id] | peptide/add | user-peptide/[id] | 17 | Complete |
| Nutrition | Self-contained cycles | Full (add/update/remove) | NutritionPlanForm | nutrition/[id] | nutrition/add | — | 2 | Complete |
| Exercise | Full (categories, custom) | Routines + regimes + sessions | Set logging UI | exercise/[id] | exercise/create | Regime/routine detail | 27 | Complete |

---

## Core Systems Status

| System | Backend | Frontend | Tests | Status |
|--------|---------|----------|-------|--------|
| Auth (signup, login, password, delete) | 6 endpoints | Login, signup, change password, delete account | 9 | Complete |
| Daily Plan (window grouping, frequency gates) | 1 endpoint | Today tab with window cards, date navigation | 8 | Complete |
| Adherence (individual + batch + protocol) | 5 endpoints | One-tap mark, mark-all, skip with reason | 14 | Complete |
| Protocols (named stacks, schedule control) | 5 endpoints | Add, detail, member management | 8 | Complete |
| Protocol Templates (curated stacks, adopt) | 3 endpoints | Browse, detail, one-tap adopt | 9 | Complete |
| Tracking (completion, streaks, per-item) | 1 endpoint | Stats screen, summary card on Today | 4 | Complete |
| AI Onboarding (Claude profiles) | 2 endpoints + Celery | Auto-generation, status polling | 8 | Complete |
| Recommendations (slot-aware, synergy-boosted) | 2 endpoints | Recommendations screen, apply flow | 8 | Complete |
| Guided Wizard (multi-turn conversational) | 1 endpoint | Chat UI, result card, apply | 7 | Complete |
| Stack Score (5-dimension composite) | 1 endpoint | Score card on Protocols tab | 8 | Complete |
| Interaction Checker | 1 endpoint | Warnings card on Today, safety screen | 8 | Complete |
| Preferences (goals, constraints, mode) | 3 endpoints | Full editor screen, onboarding flow | 8 | Complete |
| Goal Progress (per-goal adherence + journal) | 1 endpoint | Goal progress screen + Today card | 6 | Complete |
| Weekly Digest (adherence, journal, exercise) | 1 endpoint | Full screen + summary card on Today | — | Complete |
| Health Journal (energy, mood, sleep, symptoms) | 7 endpoints | Journal screen, prompt card on Today | 13 | Complete |
| Notifications (reminders, quiet hours) | 6 endpoints | Full preferences screen, push registration | 13 | Config complete, delivery incomplete |
| Data Export (CSV: stack, adherence, journal) | 3 endpoints | Export screen with web/native download | 7 | Complete |
| Weather/UV (skincare guidance) | Service-only | Skincare guidance card on Today | — | Complete |
| Offline Support (cache + write queue) | — | Read cache, write queue, auto-replay, OfflineBanner | — | Complete |
| Onboarding (new user flow) | — | 4-step flow: welcome, goals, constraints, path | — | Complete |

---

## Exercise Sub-System

| Feature | Backend | Frontend | Tests |
|---------|---------|----------|-------|
| Exercise catalog + custom exercises | 5 endpoints | Browse, detail, create custom | 27 |
| Workout routines (template builder) | 6 endpoints | Create, detail, exercise picker | 0 |
| Exercise regimes (weekly schedule) | 7 endpoints | Create, detail, day assignment | 0 |
| Workout sessions (live logging) | 9 endpoints | Start, log sets/reps/weight, finish | 0 |
| Exercise stats (volume, 1RM, muscles) | 3 endpoints | Stats screen, muscle chart | 0 |
| Gym locations (GPS geofence) | 5 endpoints | Manage screen, auto-routine loading | 0 |

---

## 5-Tab Mobile Layout

| Tab | Cards / Sections |
|-----|------------------|
| Today | Date header, tracking summary, weekly digest, goal progress, journal prompt, exercise plan, nutrition phase, skincare guidance, cycle alerts, interaction warnings, empty state CTA, take-window cards with adherence |
| Protocols | Hero stats, stack score, AI buttons (recommendations, wizard, templates), protocol stacks, active supplements/medications/therapies/peptides with catalog browsers, refill alert |
| Exercise | Hero with weekly stats, gym arrival, today's routine, recent sessions, routines list, nav links (stats, regimes, gym) |
| Nutrition | Plans list, add cycle, phase management |
| Profile | Avatar card, edit profile, preferences, goal progress, safety check, notifications, adherence stats, weekly digest, health journal, data export, change password, logout, delete account |

---

## Test Coverage

### Well-tested (8+ tests)

Exercises (27), peptides (17), adherence (14), supplements (13), health journal (13), notifications (13), auth (9), protocol templates (9), daily plan (8), stack score (8), preferences (8), protocols (8), recommendations + interactions (8)

### Undertested (1-2 tests)

Medications catalog (1), therapies catalog (1), user medications (2), user therapies (2), nutrition (2)

### Untested (0 tests)

- Workout routines — 6 endpoints
- Exercise regimes — 7 endpoints
- Workout sessions — 9 endpoints (largest gap)
- Gym locations — 5 endpoints
- Exercise stats — 3 endpoints

---

## Infrastructure

| Layer | Technology |
|-------|------------|
| Monorepo | pnpm workspaces + Turborepo |
| Backend | FastAPI, async SQLAlchemy 2.0, PostgreSQL (SQLite for dev/test) |
| Workers | Celery + Redis (AI profile generation) |
| Frontend | Expo Router (file-based), React Native |
| AI | Claude Sonnet via Anthropic SDK — onboarding, recommendations, wizard — with static fallbacks |
| Auth | JWT + bcrypt, rate limiting (slowapi), soft-delete, IDOR protection |
| Caching | Redis (AI status) + AsyncStorage (mobile read/write cache) |
| Design system | 58 color tokens, glass/nordic aesthetic, full accessibility labels |

---

## What's Fully Shipped

All 6 domain pillars end-to-end. All AI systems with fallbacks. Full adherence tracking with offline support. Account lifecycle (signup, onboarding, use, password change, data export, delete). 208 passing tests, TypeScript clean.

---

## Remaining Gaps — Priority Order

### P0 — Test Coverage

1. **Exercise workflow tests** — 30 endpoints across routines/regimes/sessions/stats/gym with 0 dedicated tests
2. **Medication/therapy/nutrition test depth** — functional but thin coverage (1-2 tests each)

### P1 — Feature Completion

3. **Push notification delivery** — preferences and registration infrastructure exist, actual Expo push dispatch not wired
4. **Docs sync** — `docs/instructions.html` and `docs/instructions.pdf` need updates for features added after initial generation (journal export, change password, delete account, onboarding, therapy/peptide add screens, weekly digest card, goal progress card, empty day card)

### P2 — Polish

5. **Interaction warnings depth** — no drill-down detail view, no severity indicator, warnings only on Today (not during add flow)
6. **Global search** — per-catalog search works but no unified cross-pillar search
7. **Protocol template quick-start** — templates browseable but not surfaced in onboarding path or empty states
8. **Weekly/monthly trend comparison** — weekly digest exists but no multi-week trend view
