# Session Resume

## What was worked on
Built the product far beyond the initial supplement-only foundation. Recent milestones added AI onboarding, supplement scheduling and adherence, regimen management, protocol stacks, medication and modality flows, nutrition cycles, UV/skincare guidance, supplement refill workflows, scheduled regime activation, tracking analytics, adherence context snapshots, and richer modality session state.

## Current state

### Done
- AI onboarding with shared supplement profiles and status lifecycle
- Today execution loop with date navigation, adherence writes, interaction warnings, and active regime labels
- User flows for supplements, medications, modalities/therapies, protocols, and nutrition
- Protocol stacks with manual and calendarized activation rules
- Tracking overview with recent events, streaks, family filters, and schedule-fit suggestions
- UV guidance and supplement refill tracking, including generated reorder/prescription text
- Historical adherence snapshots for future analytics stability
- Modality session metadata with last pattern, volume, response, and completion timestamp

### In progress
- Broader domain expansion for activities, training structures, skincare procedures, hair/grey-hair protocols, and additional catalog depth
- Continued refactor and hardening work to keep forms, API seams, and seed data modular as the domain grows

## Immediate next steps
1. Expand the seeded catalog and session schemas for activities, training, skincare, hair, and other protocol families the user listed
2. Decide whether adherence events should also snapshot dosage/session settings before future PEMPTA-style outcome analysis
3. Continue refactoring large forms and seed scripts so new domain families do not reintroduce hardcoded lists
4. Add more test coverage around tracking, regime scheduling, and richer modality/session details

## Open questions or blockers
- `main` has no upstream configured, so pushes are currently skipped
- PEMPTA integration is still future work; keep current APIs neutral and history-preserving rather than speculative
