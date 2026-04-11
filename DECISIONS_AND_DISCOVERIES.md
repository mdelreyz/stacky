# Decisions & Discoveries

## 1. Expo for all three platforms, not separate Next.js web (2026-04-08)

Chose Expo (React Native) with Expo Router for iOS, Android, **and** web from a single codebase. The alternative was a separate Next.js web app (matching Pempta's stack) + React Native for mobile. Expo web won because: (a) this is an authenticated app with no SEO needs, (b) solo developer can't maintain three codebases, (c) the shared language is TypeScript+React either way. Design tokens can still be shared with Pempta via `packages/design-system/` if needed later. Web-first development confirmed — `npx expo start --web` is the primary dev loop.

## 2. Supplement catalog is shared, not per-user (2026-04-08)

When any user onboards "Magnesium Glycinate", the AI-generated profile is stored once in the `supplements` table. Other users reuse it via fuzzy name match. Per-user customization (dosage, timing, cycling) lives in `user_supplements`. This avoids redundant Claude API calls and builds a communal knowledge base. Trade-off: the shared profile must be generic enough for all users — per-user contraindication checking happens at the interaction engine layer, not in the profile itself.

## 3. AI profiles stored as JSONB, not normalized tables (2026-04-08)

The `ai_profile` column on `supplements` and `therapies` is a JSONB blob, not a set of relational tables. Rationale: the profile schema will evolve as we refine the Claude prompt (dosage formats, new interaction types, evidence grading). JSONB avoids migration churn while remaining queryable. The TypeScript `SupplementAIProfile` interface in `packages/domain/` is the canonical schema — Python validates via Pydantic on write. `ai_profile_version` tracks which prompt version generated the data for future re-generation.

## 4. Cross-database UUID via TypeDecorator (2026-04-08)

SQLAlchemy's `postgresql.UUID(as_uuid=True)` doesn't work with SQLite. Built a custom `UUID` TypeDecorator in `database.py` that uses native PostgreSQL UUID in prod and `CHAR(32)` hex in SQLite. This enables local development without Docker (just `sqlite+aiosqlite:///./protocols.db`) while keeping the same model code. The trade-off is slightly more complex type handling, but it eliminated the Docker dependency for day-to-day development.

## 5. Pempta integration is architecturally ready but explicitly deferred (2026-04-08)

The user's sibling project Pempta (../vitalsync) is a wearable health data platform (Oura, WHOOP, Garmin). Protocols will eventually connect via OAuth + REST API for health correlation (adherence vs HRV/sleep). The backend follows Pempta's exact conventions (async SQLAlchemy, Pydantic settings with env prefix, same auth patterns) to minimize context-switching. But no integration code exists — the user wants core protocol management solid before adding data source complexity.

## 6. Interaction engine = AI breadth + hard-coded safety rules (2026-04-08)

**Decision, not yet implemented.** Interactions will come from two sources: (a) AI-generated `known_interactions` in each supplement's profile (broad coverage, may miss edge cases), and (b) a hard-coded rules engine for critical safety interactions (e.g., warfarin + vitamin K, nitroglycerin + NAC). The rules engine is the safety net — it overrides AI confidence for known dangerous combinations. **Status**: designed, implementation in Phase 3.

## 7. Regimes and tracking are cross-domain, not supplement-only (2026-04-08)

Named protocol stacks now act as reusable regimes that can be switched manually or activated by schedule rules such as date ranges and week-of-month windows. Daily plan generation and adherence writes both resolve against the same schedule engine so supplements, medications, and modalities only appear when their active regime is in effect. Execution tracking is now a first-class loop: users get a daily checklist, completion time is captured on action, and the tracking read model summarizes taken/skipped/pending counts, streaks, recent events, and suggestions.

## 8. Current architecture preserves future analysis seams (2026-04-08)

Recent work intentionally favors stable historical context over convenience joins. Adherence events now snapshot item/regime context so later renames or schedule changes do not rewrite history, and modality settings carry richer session-state fields such as last pattern, volume, response, and last completed timestamp. Operational loops were also expanded with UV-driven skincare guidance via weather data and supplement refill tracking that can generate prescription/reorder text. The user also wants their product directions broadly captured in noomix, not only narrow code decisions.

## 9. Wizard, AI failure states, and supplement seeding were hardened together (2026-04-10)

The protocol wizard now treats the conversation as a real chat flow instead of a JSON transport: the frontend no longer double-posts user turns, completion messages stay human-readable, and recommended items now carry real `catalog_id` values so “Add All to My Protocol” can succeed. AI supplement/medication onboarding also now fails fast with explicit provider-state reasons instead of sitting in a perpetual generating state when Anthropic is unavailable, misconfigured, disconnected, or out of credits. Finally, supplement seeding can now bootstrap additional catalog entries from `data/Supplement_Stack.xls` through a conservative workbook importer that merges clean non-duplicates into the existing seed flow without requiring legacy Excel parsing dependencies.

## 10. Premium frontend rollout is complete; remaining debt is structural (2026-04-10)

The ambient glass design system now covers the main Expo product surface instead of only the top-level tabs: auth, recommendations, wizard, tracking, profile settings, supplement flows, medication/therapy/peptide detail routes, nutrition management, and the full exercise/workout stack all share the same premium shell and interaction language. After the final wrapper cleanup, `REFACTORING_PLAN.md` no longer treats UI rollout as open debt; the remaining important work has shifted to structural cleanup such as duplicated backend item routes and oversized files. A small follow-up refactor also extracted shared AI-profile read helpers into `apps/mobile/lib/ai-profile.ts` and corrected the stale claim that `puppeteer` was unused, since `docs/generate-pdf.mjs` still depends on it.

## 11. The manual supplement profile pass is complete; the next catalog problem is modality drift (2026-04-10)

The local no-API manual profile pass now covers the full shared supplement catalog through `apps/api/data/manual_catalog_profiles.json`, and the local DB has matching `ai_profile` payloads for all catalog rows. That finished the content-generation phase, but it also made the semantic drift explicit: a meaningful slice of the supplement catalog is actually medication-like, peptide/hormone-like, cosmetic/haircare, food-based, branded-formula, or grouped-protocol data. The immediate direction is not to break current supplement flows, but to `mirror first, migrate later`: use the new `CATALOG_MODALITY_AUDIT.md` inventory and `apps/api/scripts/apply_catalog_modality_mirrors.py` to promote the highest-confidence rows into the existing medication, therapy, and peptide catalogs while keeping legacy supplement lookups working until the frontend and recommendation engine stop assuming a supplement-only source of truth. The first local mirror batch is already in place for `HGH`, `GR7 / Redenhair`, `Daosin`, `Emoxypine Succinate`, `Piracetam/Aniracetam`, `Potassium iodine`, and `Selbex/ Teprenone`.

## 12. Remaining refactor work is now mostly reproducibility and data-model cleanup (2026-04-10)

The highest-value open duplication seams are no longer in the route and detail-screen layers: user supplement/medication/therapy/peptide CRUD now shares `apps/api/app/services/user_item_crud.py`, and the medication/therapy/peptide mobile detail routes now share a common ambient scaffold, style system, and loading hook. The remaining important work has shifted toward semantic and operational consistency: finishing the broader catalog modality migration tracked in `M-25`, plus keeping fresh environments reproducible by replaying repo-backed manual catalog profiles and approved mirrors directly from `scripts/seed.py`. The AI onboarding fallback cache was also tightened so the in-memory path now actively prunes expired and overflow entries instead of relying on passive TTL checks alone.

## 13. Local backend defaults now match the actual SQLite-first development workflow (2026-04-11)

The backend no longer embeds a development PostgreSQL credential string as its code default. `apps/api/app/config.py` now points to the repo-local `apps/api/protocols.db` SQLite database by default, which matches the checked-in `apps/api/.env`, the local `uvicorn` flow used by `scripts/dev-web.zsh`, and the test suite's SQLite-first setup. `.env.example` now treats Postgres as an explicit override rather than the default, and `apps/api/alembic.ini` no longer carries the same hardcoded credential either; Alembic still resolves the real runtime URL from `app.config.settings` inside `migrations/env.py`.

## 14. JWT revocation now survives Redis outages without becoming process-local only (2026-04-11)

The auth layer still prefers Redis for token revocation, but it no longer degrades straight to process-scoped memory when Redis is unavailable. `apps/api/app/jwt.py` now uses a small `revoked_tokens` table as the durable fallback store and only drops to in-memory tracking if both Redis and the database fail. This keeps local and single-node environments resilient without making revocation correctness depend on one Python process remaining alive.

## 15. Current refactor work is now trimming hotspot files at natural seams, not chasing wholesale rewrites (2026-04-11)

After the backend/security cleanup, the best remaining leverage shifted to oversized files with clear internal boundaries. `apps/api/app/routes/user_preferences.py` now delegates recommendation-application mutations to `apps/api/app/services/recommendation_application.py`, while the highest-traffic AI screens on mobile (`apps/mobile/app/wizard.tsx` and `apps/mobile/app/recommendations.tsx`) now push their repeated card surfaces into dedicated components instead of carrying all rendering inline. The direction is deliberate: reduce local complexity where the seams are already obvious, and leave the larger semantic data-model item (`M-25`) as the main remaining nontrivial backlog issue rather than mixing it into unrelated UI and route cleanup.

## 16. The remaining refactor hotspots have shifted again after the latest splits (2026-04-11)

`apps/api/app/services/ai_onboarding.py` and `apps/mobile/app/(tabs)/exercise.tsx` are no longer the main large-file problem. The AI onboarding service now delegates schema/prompt/model-generation concerns to `apps/api/app/services/ai_profile_generation.py`, and the Exercise tab now only coordinates data loading plus routing while dedicated components render the hero, routines, sessions, and nav-link sections. A fresh tracked-file scan now points at a different next wave: `packages/api-client/src/client.ts`, `apps/api/app/services/guided_wizard.py`, `apps/mobile/app/workout-routine/create.tsx`, and `apps/mobile/app/(tabs)/protocols.tsx`, while the catalog modality migration tracked in `M-25` remains the main semantic backlog rather than a file-size one.

## 17. The wizard service now keeps orchestration separate from heuristic fallback logic (2026-04-11)

`apps/api/app/services/guided_wizard.py` no longer mixes prompt construction, dataclasses, heuristic preference extraction, fallback question flow, completion shaping, and the Anthropic call in one 650-line file. The public entrypoint still lives in `guided_wizard.py`, but prompt assembly now sits in `apps/api/app/services/guided_wizard_prompting.py`, the fallback and completion heuristics live in `apps/api/app/services/guided_wizard_fallback.py`, and the turn/result dataclasses live in `apps/api/app/services/guided_wizard_types.py`. This keeps the route contract unchanged while making the next real split-soon hotspots `packages/api-client/src/client.ts`, `apps/mobile/app/workout-routine/create.tsx`, and `apps/mobile/app/(tabs)/protocols.tsx`; the extracted fallback module is only in the watch zone for now, not an immediate rewrite target.
