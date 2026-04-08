# Refactoring Plan

Last updated: 2026-04-08

## Current scan summary

- No source file is near the hard limit. The largest watch-zone files are now [apps/api/scripts/seed.py](apps/api/scripts/seed.py) at 714 lines, [apps/mobile/components/ProtocolForm.tsx](apps/mobile/components/ProtocolForm.tsx) at 399 lines, and [apps/api/app/services/daily_plan.py](apps/api/app/services/daily_plan.py) at 379 lines.
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
- The third duplication pass landed with medications:
  - the daily-plan interaction model no longer uses supplement-only field names
  - medications reuse the existing regimen scheduling, adherence, and stack seams instead of forking a parallel planner
  - the mobile medication create/manage screens sit on the same schedule primitives already used by supplements

## Open findings

### Medium

1. Break up the catalog seed once another regimen family lands.
   - [apps/api/scripts/seed.py](apps/api/scripts/seed.py)
   - The script is still healthy, but medications are now in the same file and nutrition, skincare, or topical-product catalogs should move fixtures into dedicated modules before the seed keeps growing linearly.

2. Keep the Today screen below watch-zone size if medication or weather-aware skincare is added there.
   - [apps/mobile/app/(tabs)/index.tsx](apps/mobile/app/(tabs)/index.tsx)
   - The shared window card helped, but UV-driven sunscreen, nutrition adherence, or richer session completion flows should trigger another extraction pass.

3. Split protocol selection state before nutrition or skincare add more regimen families.
   - [apps/mobile/components/ProtocolForm.tsx](apps/mobile/components/ProtocolForm.tsx)
   - The current form is still manageable, but another family or two should push the item selection sections into dedicated hooks or section components instead of extending one file.

### Low

1. Align backend pagination response typing between mobile and shared client code.
   - [apps/mobile/lib/api/core.ts](apps/mobile/lib/api/core.ts)
   - [packages/api-client/src/client.ts](packages/api-client/src/client.ts)
   - Both clients still define their own small paginated response shapes. It is low risk today, but worth centralizing if another client surface is added.

2. Centralize cross-family regimen item typing before nutrition and skincare are introduced.
   - [apps/api/app/schemas/daily_plan.py](apps/api/app/schemas/daily_plan.py)
   - [packages/domain/src/daily-plan.ts](packages/domain/src/daily-plan.ts)
   - Supplements, therapies, and medications now share the same plan/adherence seams. The next family should justify promoting the remaining duplicated regimen metadata into a more explicit shared abstraction.

## Next refactor slice

1. Extract seed fixtures and regimen taxonomy into dedicated modules before nutrition or skincare catalogs land.
2. Split `ProtocolForm` selection state if another regimen family is added to stacks.
3. Add light frontend coverage around date navigation and adherence refresh behavior once a test harness is introduced.
4. Consider centralizing small cross-client response helpers shared by the mobile transport layer and `packages/api-client`.
