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
- The fourth pass landed with nutrition:
  - the dormant nutrition cycle model and Nutrition tab are now real product surface instead of disconnected placeholders
  - Today now renders both `nutrition_phase` and `cycle_alerts`, closing an existing contract gap rather than adding another hidden payload
  - nutrition type labels and macro-level options are centralized in one mobile helper instead of being repeated across screens
- The fifth pass landed with profile/weather and supplement inventory:
  - profile location and timezone are now editable instead of being read-only auth metadata
  - Today now uses a forecast-backed UV seam to render skincare guidance when coordinates are available
  - active supplements can be marked out of stock and gathered into a generated refill note instead of relying on ad hoc reminders

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

4. Extract a reusable phase editor before nutrition becomes multi-phase in the UI.
   - [apps/mobile/components/nutrition/NutritionPlanForm.tsx](apps/mobile/components/nutrition/NutritionPlanForm.tsx)
   - The current nutrition flow intentionally ships as a single-phase editor even though the backend model supports repeated phases. If true multi-phase creation lands, phase rows should become their own component instead of growing this form in place.

5. Split Today cards again if regimen scheduling or more guidance layers land there.
   - [apps/mobile/app/(tabs)/index.tsx](apps/mobile/app/(tabs)/index.tsx)
   - The screen is still controlled, but UV guidance plus richer scheduled-regime logic could push it back into watch-zone territory quickly.

### Low

1. Align backend pagination response typing between mobile and shared client code.
   - [apps/mobile/lib/api/core.ts](apps/mobile/lib/api/core.ts)
   - [packages/api-client/src/client.ts](packages/api-client/src/client.ts)
   - Both clients still define their own small paginated response shapes. It is low risk today, but worth centralizing if another client surface is added.

2. Centralize cross-family regimen item typing before nutrition and skincare are introduced.
   - [apps/api/app/schemas/daily_plan.py](apps/api/app/schemas/daily_plan.py)
   - [packages/domain/src/daily-plan.ts](packages/domain/src/daily-plan.ts)
   - Supplements, therapies, and medications now share the same plan/adherence seams. The next family should justify promoting the remaining duplicated regimen metadata into a more explicit shared abstraction.

3. Decide whether nutrition stays a dedicated cycle domain or eventually joins named protocol stacks.
   - [apps/api/app/models/nutrition_cycle.py](apps/api/app/models/nutrition_cycle.py)
   - [apps/mobile/app/(tabs)/nutrition.tsx](apps/mobile/app/(tabs)/nutrition.tsx)
   - Nutrition now has a coherent dedicated flow. If the product later needs stack composition with diet plans, that should be an explicit convergence decision rather than an ad hoc link from protocol items.

4. Decide whether protocol stacks evolve into calendarized regime schedules or remain static presets.
   - [apps/api/app/models/protocol.py](apps/api/app/models/protocol.py)
   - [apps/mobile/components/protocols/ProtocolStacksSection.tsx](apps/mobile/components/protocols/ProtocolStacksSection.tsx)
   - The user now wants vacation plans and week-of-month switching. That likely requires a dedicated temporal activation model rather than continuing to overload plain stack membership.

## Next refactor slice

1. Design and implement a calendarized regime-scheduling model before expanding vacation plans or week-of-month stack switching.
2. Extract seed fixtures and regimen taxonomy into dedicated modules before skincare or topical-product catalogs land.
3. Split `ProtocolForm` selection state if another regimen family is added to stacks.
4. Extract a reusable multi-phase nutrition editor if nutrition plans need more than one phase in the UI.
5. Add light frontend coverage around Today refresh behavior, UV guidance, and the Nutrition tab once a test harness is introduced.
6. Consider centralizing small cross-client response helpers shared by the mobile transport layer and `packages/api-client`.
