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
