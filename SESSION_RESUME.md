# Session Resume

## What was worked on
Recalibrated supplement detail scoring so `Essential` means broad, universal usefulness instead of generic supplement quality. The work was limited to the mobile score model, the shared supplement evidence-tier type, and session documentation.

## Current state

### Done
- `apps/mobile/lib/supplement-score.ts` now uses a sparse essential-scoring model based on normalized core-system coverage, nutrient-repletion signals, and niche penalties
- The shared supplement type now accepts `traditional` and `speculative` evidence tiers in `packages/domain/src/supplement.ts`
- The current local catalog distribution is roughly 12 supplements above 90, 33 between 50 and 90, and 260 below 50 for `Essential`
- Validation completed with `pnpm typecheck` and `pnpm --dir apps/mobile exec tsc --noEmit`

### Still in progress
- Unrelated API-model and test changes were already present in the working tree and were intentionally left untouched

## Immediate next steps
1. Open the supplement detail UI and sanity-check whether the 90+ names match product expectations
2. If needed, tune the near-threshold bonuses again to move the top tier slightly up or down without affecting the lower bands
3. Decide whether the backend/manual profile schema should formally widen its evidence enum to match the existing local catalog values

## Open questions or blockers
- Some 90+ results are still judgment calls, so the next useful pass is product review rather than more blind formula tweaking
- The backend Python schema still advertises only `strong|moderate|limited|emerging`, even though the local catalog and TS client now carry `traditional` and `speculative`
