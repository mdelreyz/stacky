# Protocols — Development Plan

Last updated: 2026-04-11

---

## Overall Dimensions

| Metric | Count |
|--------|-------|
| Backend endpoints | 121 across 28 route files |
| SQLAlchemy models | 23 with 54 relationships |
| Pydantic schemas | 133 classes across 18 files |
| Services | 32 business logic modules |
| API tests | 240 across 31 test files |
| Alembic migrations | 8 |
| Seed scripts | 8 |
| Mobile screens | 55 |
| Mobile components | 61 |
| API client modules | 26 |
| Lib utilities | 16 |
| Domain types | 151 exported interfaces/types |
| Design tokens | 58 color tokens |
| Stack.Screen registrations | 51 (all screens registered) |

---

## Domain Pillar Completeness

| Pillar | Catalog | User CRUD | Schedule Form | Detail | Add | Manage | Tests | Status |
|--------|---------|-----------|---------------|--------|-----|--------|-------|--------|
| Supplements | Full (taxonomy, AI profiles, onboarding) | Full (add/update/remove/refill) | SupplementScheduleForm | supplement/[id] | supplement/add | user-supplement/[id] | 13 | Complete |
| Medications | Full (categories, AI profiles, onboarding) | Full (add/update/remove) | DoseScheduleForm (shared) | medication/[id] | medication/add | user-medication/[id] | 8 | Complete |
| Therapies | Full (categories, settings JSON) | Full (add/update/remove) | TherapyScheduleForm | therapy/[id] | therapy/add | user-therapy/[id] | 8 | Complete |
| Peptides | Full (categories, goals, AI profile) | Full (add/update/remove) | PeptideScheduleForm | peptide/[id] | peptide/add | user-peptide/[id] | 17 | Complete |
| Nutrition | Self-contained cycles | Full (add/update/remove) | NutritionPlanForm | nutrition/[id] | nutrition/add | — | 10 | Complete |
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
| Tracking (completion, streaks, per-item) | 1 endpoint | Stats screen, summary card on Today | 8 | Complete |
| AI Onboarding (Claude profiles) | 2 endpoints + Celery | Auto-generation, status polling | 8 | Complete |
| Recommendations (slot-aware, synergy-boosted) | 2 endpoints | Recommendations screen, apply flow | 8 | Complete |
| Guided Wizard (multi-turn conversational) | 1 endpoint | Chat UI, result card, apply | 7 | Complete |
| Stack Score (5-dimension composite) | 1 endpoint | Score card on Protocols tab | 8 | Complete |
| Interaction Checker | 1 endpoint | Today severity card, add-flow preview, safety screen | 11 | Complete |
| Preferences (goals, constraints, mode) | 3 endpoints | Full editor screen, onboarding flow | 8 | Complete |
| Goal Progress (per-goal adherence + journal) | 1 endpoint | Goal progress screen + Today card | 8 | Complete |
| Weekly Digest (adherence, journal, exercise) | 1 endpoint | Full screen + summary card on Today, previous-week + month-to-date comparison | 8 | Complete |
| Health Journal (energy, mood, sleep, symptoms) | 7 endpoints | Journal screen, prompt card on Today | 13 | Complete |
| Notifications (reminders, quiet hours) | 7 endpoints | Full preferences screen, push registration, test delivery, scheduled automation | 19 | Complete |
| Data Export (CSV: stack, adherence, journal) | 3 endpoints | Export screen with web/native download | 7 | Complete |
| Weather/UV (skincare guidance) | Service-only | Skincare guidance card on Today | — | Complete |
| Offline Support (cache + write queue) | — | Read cache, write queue, auto-replay, OfflineBanner | — | Complete |
| Onboarding (new user flow) | — | 4-step flow: welcome, goals, constraints, path | — | Complete |

---

## Exercise Sub-System

| Feature | Backend | Frontend | Tests |
|---------|---------|----------|-------|
| Exercise catalog + custom exercises | 5 endpoints | Browse, detail, create custom | 7 |
| Workout routines (template builder) | 6 endpoints | Create, detail, exercise picker | 4 |
| Exercise regimes (weekly schedule) | 7 endpoints | Create, detail, day assignment | 3 |
| Workout sessions (live logging) | 9 endpoints | Start, log sets/reps/weight, finish | 6 |
| Exercise stats (volume, 1RM, muscles) | 3 endpoints | Stats screen, muscle chart | 3 |
| Gym locations (GPS geofence) | 5 endpoints | Manage screen, auto-routine loading | 4 |

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

Exercises (27), notifications (19), peptides (17), adherence (14), supplements (13), health journal (13), interaction checker (11), nutrition (10), auth (9), protocol templates (9), daily plan (8), stack score (8), preferences (8), protocols (8), recommendations (8), medications (8), therapies (8), goal progress (8), tracking (8), weekly digest (8)

### Recently closed gaps

Exercise workflow routes now have dedicated API coverage across routines, regimes, sessions, stats, and gym locations.
Notification delivery now supports manual verification plus scheduled automated dispatch with idempotent delivery logging.
Goal progress now includes peptide-linked support items, and the user guide/PDF match the shipped onboarding, Today, profile, export, and notification flows.
Tracking coverage now includes dense-plan suggestion behavior and request validation around the overview endpoint.
Today interaction warnings now surface severity and deep-link into the Safety Check detail view.
Protocol Library is now surfaced during onboarding and in the Today empty state, closing the template quick-start discovery gap.
Weekly Digest now compares the current week against the previous week for completion, journaling, sessions, and volume.
Weekly Digest also includes a month-to-date comparison against the equivalent window in the previous month.
Nutrition coverage now exercises future-start plans, resync-on-update behavior, and successful reactivation flows.
Add and schedule flows now preview candidate interactions against the current stack before save across supplements, medications, peptides, and therapies.
Protocols search now acts as a unified cross-pillar surface for stacks, active items, catalog discovery, exercises, nutrition plans, routines, regimes, and the protocol library.

---

## Infrastructure

| Layer | Technology |
|-------|------------|
| Monorepo | pnpm workspaces + Turborepo |
| Backend | FastAPI, async SQLAlchemy 2.0, PostgreSQL (SQLite for dev/test) |
| Workers | Celery + Redis + Celery Beat (AI profile generation, scheduled notifications) |
| Frontend | Expo Router (file-based), React Native |
| AI | Claude Sonnet via Anthropic SDK — onboarding, recommendations, wizard — with static fallbacks |
| Auth | JWT + bcrypt, rate limiting (slowapi), soft-delete, IDOR protection |
| Caching | Redis (AI status) + AsyncStorage (mobile read/write cache) |
| Design system | 58 color tokens, glass/nordic aesthetic, full accessibility labels |

---

## What's Fully Shipped

All 6 domain pillars end-to-end. All AI systems with fallbacks. Full adherence tracking with offline support. Account lifecycle (signup, onboarding, use, password change, data export, delete). 244 API tests in tree, TypeScript clean. User guide HTML/PDF synced to the current product.

---

## Remaining Gaps — Priority Order

No explicit product or coverage gaps remain in the current plan. Future work from here is new scope or optional polish rather than unfinished core functionality.
