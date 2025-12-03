# Research: Marketing Dashboard

**Feature**: 001-marketing-dashboard
**Date**: 2025-12-02
**Status**: Complete

## Research Topics

### 1. Dashboard Data Aggregation Strategy

**Decision**: Use database-level aggregation queries with Redis caching for dashboard metrics.

**Rationale**:
- PostgreSQL aggregate functions (COUNT, AVG, SUM) are efficient for statistics calculations
- Redis caching (5-minute TTL) reduces database load for frequently accessed dashboards
- Avoids over-engineering with complex real-time streaming for MVP

**Alternatives Considered**:
- Materialized views: Rejected - adds complexity, refresh overhead not justified for current scale
- Pre-computed daily summaries table: Rejected - adds write overhead, less accurate than real-time queries
- Real-time event streaming (Kafka): Rejected - over-engineering for MVP; revisit at 100k+ active users

### 2. Trend Chart Library Selection

**Decision**: Use Recharts for React-based charting.

**Rationale**:
- Built on React and D3, native TypeScript support
- Lightweight (~40KB gzipped) compared to Chart.js (~60KB)
- Declarative API matches React patterns
- Good documentation and shadcn/ui compatibility
- Already used in similar SaaS dashboard patterns

**Alternatives Considered**:
- Chart.js: Rejected - imperative API, less React-native feel
- Victory: Rejected - larger bundle, more complex configuration
- Nivo: Rejected - heavier weight, more features than needed
- Tremor (shadcn charts): Considered - but Recharts gives more control for custom visualizations

### 3. Calendar Component Approach

**Decision**: Build custom calendar grid using date-fns and shadcn/ui primitives.

**Rationale**:
- Full control over post status indicators and click interactions
- Consistent styling with existing shadcn/ui components
- date-fns already in project dependencies (lightweight date manipulation)
- Avoid heavy calendar libraries when only week/month views needed

**Alternatives Considered**:
- react-big-calendar: Rejected - heavy dependency, Google Calendar-like features not needed
- FullCalendar: Rejected - commercial features not needed, large bundle
- @shadcn/ui calendar: Evaluated - good for date pickers but not for event display grids

### 4. API Response Caching Strategy

**Decision**: Implement two-tier caching with React Query (client) + Redis (server).

**Rationale**:
- TanStack Query handles client-side caching with stale-while-revalidate pattern
- Redis provides server-side caching for expensive aggregate queries
- Reduces database load while maintaining data freshness (<1 hour per SC-002)

**Cache TTLs**:
| Endpoint | Redis TTL | Query staleTime |
|----------|-----------|-----------------|
| Review stats | 5 min | 2 min |
| Posting calendar | 5 min | 2 min |
| Engagement metrics | 15 min | 5 min |
| Trend data | 30 min | 10 min |

### 5. Multi-Shop Context Management

**Decision**: Use URL query parameter for shop selection with Zustand for local state.

**Rationale**:
- Query param (`?shopId=xxx`) enables shareable dashboard links
- Zustand persists last-selected shop in localStorage for return visits
- No need for complex context providers - simple prop drilling sufficient

**Alternatives Considered**:
- React Context only: Rejected - loses state on page refresh
- URL path param (`/dashboard/:shopId`): Rejected - complicates routing for single-page dashboard

### 6. Post Model Schema Design

**Decision**: Create new `Post` model for Instagram posts with engagement tracking.

**Rationale**:
- Separate from Review model (different source, different metrics)
- Supports scheduled, published, failed states
- Stores engagement metrics (likes, comments, reach) with sync timestamp

**Schema fields**:
- `id`, `shop_id`, `instagram_post_id` (external reference)
- `status` (enum: draft, scheduled, published, failed)
- `scheduled_at`, `published_at`
- `image_url`, `caption`, `hashtags`
- `likes_count`, `comments_count`, `reach_count`, `engagement_synced_at`
- `error_message` (for failed posts)

### 7. Pending Reviews Quick Action Flow

**Decision**: Inline expansion for AI response generation with modal confirmation.

**Rationale**:
- Reduces context switching (stays on dashboard)
- Shows generated response in expandable card for review
- Modal confirmation before publishing prevents accidental posts

**UX Flow**:
1. User clicks "Generate Response" on pending review card
2. Card expands to show loading state
3. AI response appears in editable textarea
4. User edits if needed, clicks "Approve & Publish"
5. Confirmation modal with final review
6. Success toast, card collapses, review moves to "responded"

### 8. Empty State Handling

**Decision**: Contextual empty states with actionable guidance per section.

**Empty State Messages**:
| Section | Message | Action |
|---------|---------|--------|
| Review Stats | "Connect your review platforms to see statistics" | Link to settings |
| Posting Calendar | "No posts scheduled. Create your first post!" | Link to create post |
| Engagement | "Publish posts to see engagement metrics" | Link to posting calendar |
| Trends | "Not enough data yet. Check back in a few days." | None (informational) |
| Pending Reviews | "All caught up! No reviews need responses." | Celebration icon |

## Dependencies Identified

### Backend (Python)

| Package | Version | Purpose |
|---------|---------|---------|
| fastapi | existing | API framework |
| sqlalchemy | existing | ORM |
| redis | existing | Caching |
| pydantic | existing | Schema validation |

### Frontend (TypeScript)

| Package | Version | Purpose |
|---------|---------|---------|
| @tanstack/react-query | existing | Data fetching |
| recharts | ^2.12.x | Charts |
| date-fns | ^3.x | Date manipulation |
| zustand | existing | State management |
| shadcn/ui | existing | UI components |

**No new major dependencies required** - leverages existing stack.

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Instagram API rate limits | Stale engagement data | 15-min cache TTL, background sync job |
| Large review datasets slow queries | Dashboard timeout | Pagination, date range limits, index optimization |
| Multi-shop dropdown confusing | User selects wrong shop | Persist selection, show shop name prominently |
| AI response generation latency | User abandonment | Show skeleton loader, timeout after 10s with retry |

## Research Conclusion

All technical decisions resolved. No NEEDS CLARIFICATION items remaining. Ready for Phase 1: Design & Contracts.
