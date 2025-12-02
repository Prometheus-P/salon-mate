# Tasks: Marketing Dashboard

**Input**: Design documents from `/specs/001-marketing-dashboard/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/dashboard-api.yaml

**Tests**: Tests are included per Constitution Principle I (Test-First Development - NON-NEGOTIABLE).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Project initialization and shared infrastructure

- [x] T001 Install recharts dependency in src/frontend/ with `pnpm add recharts`
- [x] T002 [P] Create Post model in src/backend/models/post.py per data-model.md
- [x] T003 [P] Create Alembic migration for posts table in src/backend/alembic/versions/
- [x] T004 [P] Create Alembic migration for review dashboard indexes in src/backend/alembic/versions/
- [ ] T005 Run migrations with `alembic upgrade head` in src/backend/
- [x] T006 [P] Create dashboard Pydantic schemas in src/backend/schemas/dashboard.py
- [x] T007 [P] Create dashboard API client functions in src/frontend/src/lib/api/dashboard.ts
- [x] T008 [P] Create TanStack Query hooks in src/frontend/src/app/dashboard/hooks/useDashboard.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T009 Create DashboardService class scaffold in src/backend/services/dashboard_service.py
- [x] T010 [P] Create dashboard router scaffold in src/backend/api/v1/dashboard.py
- [x] T011 Register dashboard router in src/backend/api/v1/__init__.py
- [x] T012 [P] Create ShopSelector component in src/frontend/src/app/dashboard/components/ShopSelector.tsx
- [x] T013 [P] Create empty state component in src/frontend/src/app/dashboard/components/EmptyState.tsx
- [x] T014 Update dashboard page layout with shop context in src/frontend/src/app/dashboard/page.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Review Performance Summary (Priority: P1)

**Goal**: Shop owners see total reviews, average rating, response rate, and pending count at a glance

**Independent Test**: Login as shop owner with reviews → navigate to dashboard → verify statistics display

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T015 [P] [US1] Write unit test for get_review_stats service method in src/backend/tests/unit/test_dashboard_service.py
- [x] T016 [P] [US1] Write integration test for GET /dashboard/{shop_id}/stats endpoint in src/backend/tests/integration/test_dashboard_api.py
- [x] T017 [P] [US1] Write component test for ReviewStats in src/frontend/__tests__/dashboard/ReviewStats.test.tsx

### Implementation for User Story 1

- [x] T018 [US1] Implement get_review_stats method in src/backend/services/dashboard_service.py (FR-001, FR-002, FR-003, FR-004)
- [x] T019 [US1] Implement GET /dashboard/{shop_id}/stats endpoint in src/backend/api/v1/dashboard.py
- [x] T019b [FR-016] Add integration test for multi-shop switching in src/backend/tests/integration/test_dashboard_api.py
- [ ] T020 [US1] Add Redis caching for review stats (5-min TTL) in src/backend/services/dashboard_service.py (DEFERRED - requires Redis)
- [x] T021 [P] [US1] Create ReviewStats component in src/frontend/src/app/dashboard/components/ReviewStats.tsx
- [x] T022 [US1] Add useReviewStats hook call in src/frontend/src/app/dashboard/hooks/useDashboard.ts (already existed)
- [x] T023 [US1] Integrate ReviewStats into dashboard page in src/frontend/src/app/dashboard/page.tsx
- [x] T024 [US1] Add empty state handling for no reviews in ReviewStats component

**Checkpoint**: User Story 1 complete - shop owners can view review statistics independently

---

## Phase 4: User Story 2 - View Posting Calendar (Priority: P2)

**Goal**: Shop owners see scheduled/published posts on a calendar with status indicators

**Independent Test**: Create scheduled posts → view calendar → verify posts appear on correct dates with status colors

### Tests for User Story 2

- [x] T025 [P] [US2] Write unit test for get_posting_calendar service method in src/backend/tests/unit/test_dashboard_service.py
- [x] T026 [P] [US2] Write integration test for GET /dashboard/{shop_id}/calendar endpoint in src/backend/tests/integration/test_dashboard_api.py
- [x] T027 [P] [US2] Write component test for PostingCalendar in src/frontend/__tests__/dashboard/PostingCalendar.test.tsx

### Implementation for User Story 2

- [x] T028 [US2] Implement get_posting_calendar method in src/backend/services/dashboard_service.py (FR-005, FR-006, FR-007)
- [x] T029 [US2] Implement GET /dashboard/{shop_id}/calendar endpoint in src/backend/api/v1/dashboard.py
- [ ] T030 [US2] Add Redis caching for calendar data (5-min TTL) in src/backend/services/dashboard_service.py (DEFERRED - requires Redis)
- [x] T031 [P] [US2] Create PostingCalendar component with week/month views in src/frontend/src/app/dashboard/components/PostingCalendar.tsx
- [x] T032 [US2] Add usePostingCalendar hook call in src/frontend/src/app/dashboard/hooks/useDashboard.ts (already existed)
- [x] T033 [US2] Integrate PostingCalendar into dashboard page in src/frontend/src/app/dashboard/page.tsx
- [x] T034 [US2] Add post status color indicators (green=published, yellow=scheduled, red=failed) in PostingCalendar

**Checkpoint**: User Story 2 complete - shop owners can view posting calendar independently

---

## Phase 5: User Story 3 - View Engagement Metrics (Priority: P3)

**Goal**: Shop owners see total likes, comments, reach, and top performing posts

**Independent Test**: View published posts with engagement data → verify metrics display and top posts ranking

### Tests for User Story 3

- [x] T035 [P] [US3] Write unit test for get_engagement_metrics service method in src/backend/tests/unit/test_dashboard_service.py
- [x] T036 [P] [US3] Write integration test for GET /dashboard/{shop_id}/engagement endpoint in src/backend/tests/integration/test_dashboard_api.py
- [x] T037 [P] [US3] Write component test for EngagementMetrics in src/frontend/__tests__/dashboard/EngagementMetrics.test.tsx

### Implementation for User Story 3

- [x] T038 [US3] Implement get_engagement_metrics method in src/backend/services/dashboard_service.py (FR-008, FR-009)
- [x] T039 [US3] Implement GET /dashboard/{shop_id}/engagement endpoint in src/backend/api/v1/dashboard.py (already existed)
- [ ] T040 [US3] Add Redis caching for engagement data (15-min TTL) in src/backend/services/dashboard_service.py (DEFERRED - requires Redis)
- [x] T041 [P] [US3] Create EngagementMetrics component in src/frontend/src/app/dashboard/components/EngagementMetrics.tsx
- [x] T042 [US3] Add useEngagementMetrics hook call in src/frontend/src/app/dashboard/hooks/useDashboard.ts (already existed)
- [x] T043 [US3] Integrate EngagementMetrics into dashboard page in src/frontend/src/app/dashboard/page.tsx
- [x] T044 [US3] Add top posts carousel/grid with engagement scores in EngagementMetrics

**Checkpoint**: User Story 3 complete - shop owners can view engagement metrics independently

---

## Phase 6: User Story 4 - View Trend Charts (Priority: P4)

**Goal**: Shop owners see review rating and count trends over selectable time periods

**Independent Test**: View charts with historical data → switch between week/month/year → verify data updates

### Tests for User Story 4

- [x] T045 [P] [US4] Write unit test for get_trend_data service method in src/backend/tests/unit/test_dashboard_service.py
- [x] T046 [P] [US4] Write integration test for GET /dashboard/{shop_id}/trends endpoint in src/backend/tests/integration/test_dashboard_api.py
- [x] T047 [P] [US4] Write component test for TrendCharts in src/frontend/__tests__/dashboard/TrendCharts.test.tsx

### Implementation for User Story 4

- [x] T048 [US4] Implement get_trend_data method in src/backend/services/dashboard_service.py (FR-010, FR-011)
- [x] T049 [US4] Implement GET /dashboard/{shop_id}/trends endpoint in src/backend/api/v1/dashboard.py (already existed)
- [ ] T050 [US4] Add Redis caching for trend data (30-min TTL) in src/backend/services/dashboard_service.py (DEFERRED - requires Redis)
- [x] T051 [P] [US4] Create TrendCharts component with Recharts in src/frontend/src/app/dashboard/components/TrendCharts.tsx
- [x] T052 [US4] Add useTrendData hook call in src/frontend/src/app/dashboard/hooks/useDashboard.ts (already existed)
- [x] T053 [US4] Integrate TrendCharts into dashboard page in src/frontend/src/app/dashboard/page.tsx
- [x] T054 [US4] Add period selector (week/month/year) toggle in TrendCharts

**Checkpoint**: User Story 4 complete - shop owners can view trend charts independently

---

## Phase 7: User Story 5 - Quick Actions on Pending Reviews (Priority: P5)

**Goal**: Shop owners respond to pending reviews with AI-generated responses directly from dashboard

**Independent Test**: View pending review → click Generate Response → approve → verify response published

### Tests for User Story 5

- [x] T055 [P] [US5] Write unit test for get_pending_reviews service method in src/backend/tests/unit/test_dashboard_service.py
- [x] T056 [P] [US5] Write unit test for generate_ai_response service method in src/backend/tests/unit/test_dashboard_service.py
- [x] T057 [P] [US5] Write unit test for publish_response service method in src/backend/tests/unit/test_dashboard_service.py
- [x] T058 [P] [US5] Write integration test for GET /dashboard/{shop_id}/pending-reviews endpoint in src/backend/tests/integration/test_dashboard_api.py
- [x] T059 [P] [US5] Write integration test for POST generate-response endpoint in src/backend/tests/integration/test_dashboard_api.py
- [x] T060 [P] [US5] Write integration test for POST publish-response endpoint in src/backend/tests/integration/test_dashboard_api.py
- [x] T061 [P] [US5] Write component test for PendingReviews in src/frontend/__tests__/dashboard/PendingReviews.test.tsx

### Implementation for User Story 5

- [x] T062 [US5] Implement get_pending_reviews method in src/backend/services/dashboard_service.py (FR-012)
- [x] T063 [US5] Implement generate_ai_response method integrating with AI service in src/backend/services/dashboard_service.py (FR-013)
- [x] T064 [US5] Implement publish_response method in src/backend/services/dashboard_service.py (FR-014)
- [x] T065 [US5] Implement GET /dashboard/{shop_id}/pending-reviews endpoint in src/backend/api/v1/dashboard.py
- [x] T066 [US5] Implement POST /dashboard/{shop_id}/reviews/{id}/generate-response endpoint in src/backend/api/v1/dashboard.py
- [x] T067 [US5] Implement POST /dashboard/{shop_id}/reviews/{id}/publish-response endpoint in src/backend/api/v1/dashboard.py
- [x] T068 [P] [US5] Create PendingReviews component with expandable cards in src/frontend/src/app/dashboard/components/PendingReviews.tsx
- [x] T069 [US5] Add usePendingReviews and mutation hooks in src/frontend/src/app/dashboard/hooks/useDashboard.ts (already existed)
- [x] T070 [US5] Integrate PendingReviews into dashboard page in src/frontend/src/app/dashboard/page.tsx
- [x] T071 [US5] Add AI response generation loading state and editable textarea in PendingReviews
- [ ] T072 [US5] Add publish confirmation modal in PendingReviews component (DEFERRED - basic publish works)
- [ ] T073 [US5] Add success toast and optimistic update after publish in PendingReviews (DEFERRED - basic success message works)

**Checkpoint**: User Story 5 complete - shop owners can respond to reviews from dashboard

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T074 [P] Add data freshness indicators (last_synced_at) to all dashboard cards (already implemented in ReviewStats, EngagementMetrics, PostingCalendar)
- [x] T075 [P] Add structured logging for all dashboard service methods in src/backend/services/dashboard_service.py
- [ ] T076 [P] Add Sentry error tracking for dashboard API errors (DEFERRED - requires Sentry setup)
- [x] T077 [P] Add loading skeletons for all dashboard components (CardSkeleton already exists and is used)
- [x] T078 Run quickstart.md validation to verify all acceptance scenarios pass
  - Backend: 94 tests passed
  - Frontend: 70 tests passed
- [ ] T079 Performance optimization: verify dashboard load <3s (SC-001) (DEFERRED - requires runtime verification)
- [x] T080 Run full test suite and verify 80% coverage for new code:
  - Backend: dashboard_service.py 89%, api/v1/dashboard.py 83% ✅
  - Frontend: 70 tests passed ✅

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4 → P5)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Requires Post model from Setup
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Requires Post model from Setup
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 5 (P5)**: Can start after Foundational (Phase 2) - No dependencies on other stories

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Service methods before API endpoints
- Backend before frontend components
- Components before page integration
- Story complete before moving to next priority

### Parallel Opportunities

- T002, T003, T004 can run in parallel (different files)
- T006, T007, T008 can run in parallel (different files)
- T010, T012, T013 can run in parallel (different files)
- All test tasks within a story marked [P] can run in parallel
- User Stories 1-5 can be worked on in parallel after Foundational phase (by different developers)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Write unit test for get_review_stats in src/backend/tests/unit/test_dashboard_service.py"
Task: "Write integration test for GET /stats in src/backend/tests/integration/test_dashboard_api.py"
Task: "Write component test for ReviewStats in src/frontend/__tests__/dashboard/ReviewStats.test.tsx"

# Then implement sequentially:
Task: "Implement get_review_stats method"
Task: "Implement GET /stats endpoint"
Task: "Create ReviewStats component"
Task: "Integrate into dashboard page"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (P1 - highest priority)
   - Developer B: User Story 2 (P2)
   - Developer C: User Story 4 (P4 - least dependencies)
3. Stories complete and integrate independently
4. Remaining stories assigned as developers free up

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD RED phase)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All endpoints require JWT authentication and shop ownership validation
- Redis caching TTLs: stats 5min, calendar 5min, engagement 15min, trends 30min
