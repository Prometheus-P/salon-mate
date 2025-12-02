# Quickstart: Marketing Dashboard

**Feature**: 001-marketing-dashboard
**Date**: 2025-12-02

## Prerequisites

- Backend server running (`uvicorn main:app --reload` in `src/backend/`)
- Frontend dev server running (`pnpm dev` in `src/frontend/`)
- PostgreSQL database with migrations applied
- Redis running for caching
- Authenticated user session with at least one shop

## Verification Steps

### 1. Database Setup

```bash
cd src/backend

# Apply migrations (creates posts table, adds indexes)
alembic upgrade head

# Verify tables exist
python -c "from models.post import Post; print('Post model imported successfully')"
```

### 2. Seed Test Data (Development)

```bash
# Run seed script to create test shop with reviews and posts
python scripts/seed_dashboard_data.py
```

Expected output:
```
Created shop: Test Salon (id: xxx)
Created 25 reviews (10 pending, 15 replied)
Created 15 posts (5 scheduled, 8 published, 2 failed)
Dashboard data ready for testing.
```

### 3. API Endpoint Verification

```bash
# Get auth token (replace with your test credentials)
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  | jq -r '.access_token')

# Test dashboard stats endpoint
curl -s http://localhost:8000/api/v1/dashboard/{shop_id}/stats \
  -H "Authorization: Bearer $TOKEN" | jq

# Expected response shape:
# {
#   "total_reviews": 25,
#   "average_rating": 4.2,
#   "response_rate": 60.0,
#   "pending_count": 10,
#   "by_platform": {...},
#   "last_synced_at": "2025-12-02T..."
# }
```

### 4. Frontend Dashboard Verification

1. Navigate to `http://localhost:3000/dashboard`
2. Verify shop selector shows available shops (top right)
3. Verify Review Stats card displays:
   - Total review count
   - Average rating with stars
   - Response rate percentage
   - Pending reviews count
4. Verify Posting Calendar shows:
   - Current month view by default
   - Posts with status indicators (green=published, yellow=scheduled, red=failed)
   - Week/Month toggle works
5. Verify Engagement section shows:
   - Total likes, comments, reach
   - Top 5 performing posts
6. Verify Trend Charts show:
   - Line chart for review rating over time
   - Bar chart for review count
   - Period selector (week/month/year)
7. Verify Pending Reviews section shows:
   - List of reviews needing response
   - "Generate Response" button works
   - "Approve & Publish" flow completes

### 5. Quick Action Flow Test

1. Click "Generate Response" on a pending review
2. Wait for AI response (loading indicator visible)
3. Verify response appears in expandable card
4. Edit response if desired
5. Click "Approve & Publish"
6. Confirm in modal
7. Verify:
   - Success toast appears
   - Review moves out of pending list
   - Response rate updates

### 6. Empty State Verification

Create a new shop with no data and verify:
- Review Stats shows "Connect platforms" CTA
- Calendar shows "No posts" empty state
- Engagement shows "Publish posts first" message
- Trends shows "Not enough data" message
- Pending Reviews shows "All caught up!" celebration

### 7. Multi-Shop Verification

If user has multiple shops:
1. Select different shop from dropdown
2. Verify all dashboard sections update
3. Verify URL updates with `?shopId=xxx`
4. Refresh page - verify selected shop persists

## Common Issues

| Issue | Solution |
|-------|----------|
| "Shop not found" error | Verify shop_id is valid UUID and user owns the shop |
| Empty dashboard despite data | Check Redis cache; try `redis-cli FLUSHDB` to clear |
| Slow trend queries | Ensure indexes exist: `idx_reviews_shop_date` |
| AI response timeout | Check OpenAI API key and rate limits |

## Success Criteria Validation

| Criteria | How to Verify |
|----------|---------------|
| SC-001: Load <3s | Chrome DevTools Network tab, measure DOMContentLoaded |
| SC-002: Data <1hr stale | Check `last_synced_at` in API responses |
| SC-003: 90% find review <60s | User testing observation |
| SC-004: Calendar <2s | Performance timing for 100 posts |
| SC-006: 1000 concurrent | Load test with k6 or similar |
| SC-007: AI response <10s | Measure from click to response display |
