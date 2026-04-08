# Refactoring Plan

Last updated: 2026-04-08

## Current scan summary

- No source file is near the hard limit. The largest app files are now [apps/mobile/app/supplement/[id].tsx](apps/mobile/app/supplement/[id].tsx) at 460 lines, [apps/mobile/app/(tabs)/index.tsx](apps/mobile/app/(tabs)/index.tsx) at 365 lines, and [apps/api/scripts/seed.py](apps/api/scripts/seed.py) at 525 lines.
- No `TODO`, `FIXME`, `HACK`, or `XXX` markers were found in app source files.
- The first duplication pass already landed this session:
  - shared frequency and take-window values now come from shared domain/mobile schedule modules
  - mobile API contracts now reuse shared domain types instead of redefining protocol and daily-plan shapes locally
  - user-supplement serialization is shared between regimen and protocol routes
  - cross-platform `showError` alert handling is centralized in one helper
  - modal create/edit flows now share a reusable header/back-button component
- The second duplication pass also landed:
  - therapy catalog and user-therapy response shaping now reuse a shared serializer
  - the Today tab uses a generic `details` field plus shared adherence handling for supplements and modalities
  - the Protocols tab is split into small section components instead of one growing screen file
  - protocol stack forms now reuse the same selection flow for supplements and modalities

## Open findings

### Medium

1. Break up the catalog seed once another regimen family lands.
   - [apps/api/scripts/seed.py](apps/api/scripts/seed.py)
   - The script is still healthy, but medication or topical-product catalogs should move seeded fixtures into dedicated modules rather than extending a single file indefinitely.

2. Keep the Today screen below watch-zone size if medication or weather-aware skincare is added there.
   - [apps/mobile/app/(tabs)/index.tsx](apps/mobile/app/(tabs)/index.tsx)
   - The shared window card helped, but medication, UV-driven sunscreen, or richer session completion flows should trigger another extraction pass.

### Low

1. Align backend pagination response typing between mobile and shared client code.
   - [apps/mobile/lib/api/core.ts](apps/mobile/lib/api/core.ts)
   - [packages/api-client/src/client.ts](packages/api-client/src/client.ts)
   - Both clients still define their own small paginated response shapes. It is low risk today, but worth centralizing if another client surface is added.

2. Centralize cross-family regimen item typing before medications are introduced.
   - [apps/api/app/schemas/daily_plan.py](apps/api/app/schemas/daily_plan.py)
   - [packages/domain/src/daily-plan.ts](packages/domain/src/daily-plan.ts)
   - Supplements and therapies now share the same plan/adherence seams, but medications will likely justify a more explicit shared regimen-item abstraction.

## Next refactor slice

1. Add light frontend coverage around date navigation and adherence refresh behavior once a test harness is introduced.
2. Consider centralizing small cross-client response helpers shared by the mobile transport layer and `packages/api-client`.
3. Extract seed fixtures and regimen-item taxonomy into dedicated modules before medication or topical skincare families land.
