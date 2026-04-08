# Refactoring Plan

Last updated: 2026-04-08

## Current scan summary

- No source file is near the hard limit. The largest app files are [apps/mobile/app/supplement/[id].tsx](apps/mobile/app/supplement/[id].tsx) at 460 lines, [apps/mobile/app/(tabs)/index.tsx](apps/mobile/app/(tabs)/index.tsx) at 365 lines, and [apps/mobile/app/(tabs)/protocols.tsx](apps/mobile/app/(tabs)/protocols.tsx) at 326 lines.
- No `TODO`, `FIXME`, `HACK`, or `XXX` markers were found in app source files.
- The first duplication pass already landed this session:
  - shared frequency and take-window values now come from shared domain/mobile schedule modules
  - mobile API contracts now reuse shared domain types instead of redefining protocol and daily-plan shapes locally
  - user-supplement serialization is shared between regimen and protocol routes
  - cross-platform `showError` alert handling is centralized in one helper
  - modal create/edit flows now share a reusable header/back-button component

## Open findings

### Medium

1. Watch the largest UI files before the next feature round.
   - [apps/mobile/app/supplement/[id].tsx](apps/mobile/app/supplement/[id].tsx)
   - [apps/mobile/app/(tabs)/protocols.tsx](apps/mobile/app/(tabs)/protocols.tsx)
   - These are still healthy, but should be split further if another major feature lands there.

2. Split the mobile transport layer by resource before it becomes a catch-all file.
   - [apps/mobile/lib/api.ts](apps/mobile/lib/api.ts)
   - It now handles auth, daily plan, protocols, supplements, and user supplements. Extracting per-resource modules behind a shared request helper will keep future flows isolated and easier to test.

### Low

1. Align backend pagination response typing between mobile and shared client code.
   - [apps/mobile/lib/api.ts](apps/mobile/lib/api.ts)
   - [packages/api-client/src/client.ts](packages/api-client/src/client.ts)
   - Both clients still define their own small paginated response shapes. It is low risk today, but worth centralizing if another client surface is added.

## Next refactor slice

1. Split `apps/mobile/lib/api.ts` into a shared request helper plus `auth`, `dailyPlan`, `protocols`, and `supplements` modules.
2. Extract the supplement detail screen into smaller profile/status sections before adding more onboarding or evidence UI there.
3. Add light frontend coverage around date navigation and adherence refresh behavior once a test harness is introduced.
