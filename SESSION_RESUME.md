# Session Resume

## What was worked on
Built the complete Phase 1 foundation for Stacky (Protocols) — a cross-platform health protocol management app. Created a pnpm monorepo with FastAPI backend, Expo (React Native) frontend, shared TypeScript packages, and Docker infrastructure. Seeded 10 supplements with comprehensive AI profiles. All endpoints tested end-to-end.

## Current state

### Done
- Monorepo scaffold (pnpm + Turborepo)
- FastAPI backend with JWT auth, 10 domain models, supplement CRUD, user supplement CRUD
- SQLite local dev setup (no Docker required)
- 10 seeded supplements with full AI profiles (Vitamin D3, Magnesium, Ashwagandha, Omega-3, Zinc, Creatine, NAC, K2, Curcumin, Probiotics)
- Expo app with 14 web routes: auth (login/signup), 4 tabs (Today, Protocols, Nutrition, Profile), supplement detail with AI profile rendering, supplement onboarding screen
- Shared TypeScript domain types (`packages/domain/`) and typed API client (`packages/api-client/`)
- Docker Compose config (PostgreSQL, Redis, API, Worker)
- Celery worker stub
- CLAUDE.md with conventions, noomix lifecycle rules

### In progress
- GitHub push to mdelreyz/stacky (needs `gh auth login` or SSH key setup)

## Immediate next steps
1. **Push to GitHub**: Run `gh auth login` then `git push -u origin main` (or set SSH remote)
2. **Phase 2 — AI Onboarding**: Wire Celery + Claude Sonnet API to auto-generate supplement profiles on onboard
3. **Phase 2 — Daily Plan**: Build the daily plan computation service and "Today" tab with take-window grouping
4. **UX refinement**: Run the web app (`cd apps/mobile && npx expo start --web`) and iterate on design

## How to run
```bash
# Backend
cd apps/api && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000

# Frontend (web)
cd apps/mobile && npx expo start --web
```

## Open questions
- None blocking. User wants web-first development, core features before Pempta integration.
