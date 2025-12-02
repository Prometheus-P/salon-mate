# Implementation Plan: Marketing Dashboard

**Branch**: `001-marketing-dashboard` | **Date**: 2025-12-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-marketing-dashboard/spec.md`

## Summary

Build a comprehensive marketing analytics dashboard for salon owners to monitor review performance, Instagram posting engagement, and overall marketing metrics. The dashboard aggregates data from multiple platforms (Naver, Google, Instagram) and provides quick actions for pending review responses via AI.

**Technical approach**: Extend the existing FastAPI backend with new dashboard API endpoints and React components using TanStack Query for data fetching, Recharts for trend visualization, and shadcn/ui for consistent UI.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript 5.x (frontend)
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0, Next.js 14, TanStack Query, Recharts, shadcn/ui
**Storage**: PostgreSQL (Supabase), Redis (caching - DEFERRED: Redis infrastructure not yet available; caching tasks T020/T030/T040/T050 are deferred until Redis is set up. Dashboard will function without caching initially.)
**Testing**: pytest + pytest-asyncio (backend), Vitest + React Testing Library (frontend)
**Target Platform**: Web (responsive for mobile via Capacitor future)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: Dashboard load <3s, 1,000 concurrent users, API response <200ms p95
**Constraints**: Data freshness ≤1 hour, support up to 100 posts per calendar view
**Scale/Scope**: Multi-shop owners, up to 10,000 reviews per shop, 365 days trend history

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Test-First Development | ✅ PASS | Tasks will include tests before implementation |
| II. API-First Design | ✅ PASS | OpenAPI contracts in `/contracts/` before endpoints |
| III. Security & Privacy | ✅ PASS | JWT auth required, shop ownership validated |
| IV. Observability | ✅ PASS | Structured logging, Sentry, latency metrics planned |
| V. Simplicity (YAGNI) | ✅ PASS | Minimal dashboard, no speculative features |
| VI. Versioning | ✅ PASS | API v1 path prefix maintained |
| VII. Code Quality Gates | ✅ PASS | Type checking, linting, tests required |

**Gate Result**: PASS - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/001-marketing-dashboard/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI specs)
│   └── dashboard-api.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/backend/
├── api/
│   └── v1/
│       └── dashboard.py      # NEW: Dashboard endpoints
├── models/
│   ├── shop.py               # EXISTING
│   ├── review.py             # EXISTING
│   └── post.py               # NEW: Instagram post model
├── schemas/
│   └── dashboard.py          # NEW: Pydantic schemas
├── services/
│   └── dashboard_service.py  # NEW: Business logic
└── tests/
    ├── unit/
    │   └── test_dashboard_service.py
    └── integration/
        └── test_dashboard_api.py

src/frontend/
├── src/
│   ├── app/
│   │   └── dashboard/
│   │       ├── page.tsx              # MODIFY: Main dashboard page
│   │       ├── components/
│   │       │   ├── ReviewStats.tsx   # NEW: Review summary card
│   │       │   ├── PostingCalendar.tsx # NEW: Calendar component
│   │       │   ├── EngagementMetrics.tsx # NEW: Engagement card
│   │       │   ├── TrendCharts.tsx   # NEW: Charts component
│   │       │   ├── PendingReviews.tsx # NEW: Quick actions list
│   │       │   └── ShopSelector.tsx  # NEW: Multi-shop dropdown
│   │       └── hooks/
│   │           └── useDashboard.ts   # NEW: TanStack Query hooks
│   └── lib/
│       └── api/
│           └── dashboard.ts          # NEW: API client functions
└── __tests__/
    └── dashboard/
        ├── ReviewStats.test.tsx
        ├── PostingCalendar.test.tsx
        └── useDashboard.test.ts
```

**Structure Decision**: Web application structure (Option 2) - extends existing `src/backend/` and `src/frontend/` directories with new dashboard-specific modules.

## Complexity Tracking

> No constitution violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
