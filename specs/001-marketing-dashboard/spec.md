# Feature Specification: Marketing Dashboard

**Feature Branch**: `001-marketing-dashboard`
**Created**: 2025-12-02
**Status**: Draft
**Input**: User description: "Marketing Dashboard - Analytics view for salon owners to monitor review performance, Instagram posting engagement, and overall marketing metrics."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Review Performance Summary (Priority: P1)

As a salon owner, I want to see a summary of my review performance at a glance so that I can quickly understand my business reputation without digging through individual reviews.

**Why this priority**: Review management is the core value proposition of SalonMate. Salon owners need immediate visibility into their reputation status to make informed decisions about customer service and marketing efforts.

**Independent Test**: Can be fully tested by logging in as a shop owner with existing reviews and verifying the dashboard displays accurate statistics. Delivers immediate value by showing reputation health.

**Acceptance Scenarios**:

1. **Given** a logged-in shop owner with at least one connected review source, **When** they navigate to the dashboard, **Then** they see total review count, average rating (1-5 stars), and response rate percentage.

2. **Given** a logged-in shop owner with reviews from multiple platforms (Naver, Google), **When** they view the dashboard, **Then** the statistics aggregate data from all connected platforms with platform breakdown available.

3. **Given** a logged-in shop owner with no reviews yet, **When** they view the dashboard, **Then** they see a helpful empty state with guidance on connecting review sources.

---

### User Story 2 - View Posting Calendar (Priority: P2)

As a salon owner, I want to see my Instagram posting schedule in a calendar view so that I can plan content and ensure consistent marketing activity.

**Why this priority**: Content planning is essential for maintaining social media presence. A visual calendar helps salon owners avoid gaps and plan ahead.

**Independent Test**: Can be tested by creating scheduled posts and verifying they appear on the correct calendar dates. Delivers value by providing content visibility and planning capability.

**Acceptance Scenarios**:

1. **Given** a logged-in shop owner with scheduled posts, **When** they view the posting calendar, **Then** they see posts displayed on their scheduled dates with visual indicators for status (scheduled, published, failed).

2. **Given** a logged-in shop owner viewing the calendar, **When** they click on a specific date, **Then** they see details of posts scheduled for that day including preview thumbnail and caption snippet.

3. **Given** a logged-in shop owner viewing the calendar, **When** they switch between week and month views, **Then** the calendar updates to show the appropriate time range.

---

### User Story 3 - View Engagement Metrics (Priority: P3)

As a salon owner, I want to see how my Instagram posts are performing so that I can understand what content resonates with my audience.

**Why this priority**: Understanding post performance helps salon owners create better content and justify their marketing time investment.

**Independent Test**: Can be tested by viewing metrics for published posts with engagement data. Delivers value by providing actionable insights on content effectiveness.

**Acceptance Scenarios**:

1. **Given** a logged-in shop owner with published Instagram posts, **When** they view the engagement section, **Then** they see total likes, comments, and reach for their posts.

2. **Given** a logged-in shop owner with multiple published posts, **When** they view engagement metrics, **Then** they see a ranked list of top-performing posts by engagement.

3. **Given** a logged-in shop owner with posts but no engagement data available, **When** they view the dashboard, **Then** they see a message explaining data sync timing with expected refresh schedule.

---

### User Story 4 - View Trend Charts (Priority: P4)

As a salon owner, I want to see how my metrics change over time so that I can identify patterns and measure the impact of my marketing efforts.

**Why this priority**: Historical trends provide context for current performance and help identify whether marketing strategies are working.

**Independent Test**: Can be tested by viewing charts with historical data across different time periods. Delivers value by showing growth or decline patterns.

**Acceptance Scenarios**:

1. **Given** a logged-in shop owner with historical data, **When** they view trend charts, **Then** they see review rating and count trends over the selected time period.

2. **Given** a logged-in shop owner viewing trends, **When** they select different time periods (week, month, year), **Then** the charts update to reflect the selected range.

3. **Given** a logged-in shop owner with less than a week of data, **When** they view trend charts, **Then** they see available data with an indication of when more comprehensive trends will be available.

---

### User Story 5 - Take Quick Actions on Pending Reviews (Priority: P5)

As a salon owner, I want to quickly respond to pending reviews from the dashboard so that I can maintain high response rates without navigating away from my overview.

**Why this priority**: Quick actions reduce friction and help salon owners maintain engagement without context switching.

**Independent Test**: Can be tested by responding to a pending review directly from the dashboard. Delivers value by streamlining the review response workflow.

**Acceptance Scenarios**:

1. **Given** a logged-in shop owner with pending reviews, **When** they view the dashboard, **Then** they see a list of reviews awaiting response with quick action buttons.

2. **Given** a logged-in shop owner clicking "Generate AI Response" for a pending review, **When** the action completes, **Then** they see a generated response ready for review and approval.

3. **Given** a logged-in shop owner approving a generated response, **When** they confirm, **Then** the response is published and the review moves from pending to responded.

---

### Edge Cases

- What happens when external API (Naver, Google, Instagram) rate limits are exceeded? System displays cached data with last-updated timestamp and retry indicator.
- What happens when a shop owner has multiple shops? Each shop has its own dashboard; owners can switch between shops via a selector.
- What happens when historical data is incomplete due to late platform connection? Charts show data from connection date with clear date markers.
- What happens when engagement metrics fail to sync? Dashboard shows last successful sync time and manual refresh option.
- What happens when a scheduled post fails to publish? Post appears in calendar with error status and failure reason; owner is notified.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display total review count aggregated across all connected review platforms (Naver, Google).
- **FR-002**: System MUST calculate and display average star rating (1.0-5.0 scale) from all reviews.
- **FR-003**: System MUST calculate and display response rate as percentage of reviews that have been responded to.
- **FR-004**: System MUST show platform-specific breakdown of review statistics when multiple platforms are connected.
- **FR-005**: System MUST display a calendar view showing scheduled and published Instagram posts.
- **FR-006**: System MUST support week and month calendar views with navigation controls.
- **FR-007**: System MUST show post status indicators (scheduled, published, failed) on calendar entries.
- **FR-008**: System MUST display engagement metrics (likes, comments, reach) for published Instagram posts.
- **FR-009**: System MUST rank posts by engagement and display top performers.
- **FR-010**: System MUST display trend charts for review rating and count over time.
- **FR-011**: System MUST support time period selection (last 7 days, last 30 days, last 365 days) for trend charts.
- **FR-012**: System MUST display a list of pending reviews requiring response.
- **FR-013**: System MUST provide quick action buttons to generate AI responses for pending reviews.
- **FR-014**: System MUST allow review and approval of AI-generated responses before publishing. (MVP: inline edit + publish button; confirmation modal is enhancement)
- **FR-015**: System MUST update dashboard metrics within 5 minutes of new data becoming available from background sync workers. Dashboard data is refreshed on page load and every 5 minutes via TanStack Query refetch. (Note: "Near real-time" defined as ≤5 minute staleness for cached dashboard data, not live WebSocket updates.)
- **FR-016**: System MUST support multi-shop owners with shop selection capability.
- **FR-017**: System MUST display appropriate empty states with guidance when data is not yet available.
- **FR-018**: System MUST show data freshness indicators (last synced timestamp) for all metrics.

### Key Entities

- **Shop**: The salon business owned by the user. Has connected platforms, reviews, and posts. One user may own multiple shops.
- **Review**: Customer feedback from Naver or Google. Contains rating, text, date, platform source, and response status.
- **Post**: Instagram content created through SalonMate. Has status (draft, scheduled, published, failed), scheduled date, content, and engagement metrics.
- **Engagement**: Metrics for a post including likes, comments, reach, and timestamp of last update.
- **DashboardMetrics**: Aggregated statistics for display including review totals, averages, trends, and posting summaries.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Shop owners can view their complete marketing overview within 3 seconds of page load.
- **SC-002**: Dashboard displays review statistics that are no more than 1 hour stale under normal operation.
- **SC-003**: 90% of users can locate and respond to a pending review within 60 seconds of viewing the dashboard.
- **SC-004**: Calendar view loads and displays up to 100 posts within 2 seconds.
- **SC-005**: Trend charts accurately reflect historical data with less than 1% calculation variance.
- **SC-006**: System supports at least 1,000 concurrent dashboard viewers without degradation.
- **SC-007**: Quick action response generation completes within 10 seconds of user request.
- **SC-008**: 85% of shop owners report the dashboard provides useful business insights (measured via in-app feedback).

## Design System

### Material Design 3 (M3) Foundation

SalonMate 대시보드는 Material Design 3 디자인 시스템을 기반으로 구현됩니다.

**Color System (Clinical & Airy):**
- **Primary Ink**: `#1A1A1A` (charcoal) – 헤더, 본문 텍스트, 주요 CTA
- **Accent Blush**: `#FFCCCC` – 포커스 상태, 하이라이트, 로딩 인디케이터
- **Surface Cloud**: `#F5F6FA` / `#FFFFFF` – 카드/배경 계층, 4.5:1 대비 확보
- **Support Slate**: `#6B7280` – 보조 텍스트, 아이콘
- **Error**: `#D8402B` – 실패/경고
- **Success**: `#2D8A4B`
- **Info**: `#3F72C8`
- **Shadow Overlay**: `rgba(17, 24, 39, 0.03)` – 얇고 부드러운 음영

**Status Colors (Semantic - WCAG AA compliant):**
- Published (게시됨): `#2D8A4B` on `#DDF5E3`
- Scheduled (예약됨): `#B58103` on `#FFF2CC`
- Failed (실패): `#D8402B` on `#FFE1DC`
- Pending (대기중): `#6B7280` on `#F3F4F6`

**Theme Mode:**
- System Preference 자동 감지 (`prefers-color-scheme` 미디어 쿼리)
- Light/Dark 테마 모두 M3 tonal palette 기반 자동 생성
- 별도 사용자 토글 UI 없음 (OS 설정 따름)

**Component Styles:**
- **Cards**: Outlined 스타일 (border로 영역 구분, 그림자 없음)
- **Buttons**: Primary에 Filled, Secondary에 Outlined/Tonal 적용
- **Typography**: M3 Type Scale (Display, Headline, Title, Body, Label)

**Motion & Animation:**
- Subtle 수준 적용 (최소 트랜지션)
- 호버/포커스 상태 변화: 150ms ease-out
- 로딩 스피너: 회전 애니메이션
- 페이지 전환, 카드 확장 등 복잡한 애니메이션 미적용
- `prefers-reduced-motion` 미디어 쿼리 존중

**Implementation Approach:**
- 기존 Tailwind CSS 기반 유지
- M3 색상 토큰을 Tailwind config에 추가 (예: `primary-40`, `surface-variant`)
- M3 타이포그래피 스케일을 Tailwind extend로 정의
- CSS 변수로 다크모드 자동 전환 지원
- 별도 컴포넌트 라이브러리 도입 없음 (가벼운 구현)

## Clarifications

### Session 2025-12-02
- Q: Primary Brand Color 선택 → A: Purple (#6750A4) - M3 기본값, 창의성과 프리미엄 표현
- Q: Theme Mode 지원 범위 → A: System Preference - OS 설정 자동 감지
- Q: Card Elevation Style → A: Outlined - 테두리선으로 구분, 미니멀하고 정보 밀도 높음
- Q: Motion & Animation 수준 → A: Subtle - 호버/포커스 피드백, 로딩 스피너만 적용
- Q: M3 구현 방식 → A: Tailwind + M3 Tokens - 기존 Tailwind CSS에 M3 색상/타이포 토큰 추가

## Assumptions

- Shop owners have already completed onboarding and connected at least one review platform or Instagram account.
- Authentication and authorization are handled by existing auth system (out of scope for this feature).
- AI response generation service is available (uses existing AI Response Service).
- Instagram API integration exists for posting and metrics retrieval (uses existing integration or will be built separately).
- Review data sync from Naver/Google is handled by background workers (existing or separate feature).
- Time periods use the shop's configured timezone for calculations.
