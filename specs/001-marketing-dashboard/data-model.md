# Data Model: Marketing Dashboard

**Feature**: 001-marketing-dashboard
**Date**: 2025-12-02

## Entity Overview

```
┌─────────┐       ┌─────────┐       ┌─────────┐
│  User   │──1:N──│  Shop   │──1:N──│ Review  │
└─────────┘       └─────────┘       └─────────┘
                       │
                       │──1:N──┌─────────┐
                               │  Post   │
                               └─────────┘
```

## Existing Entities (Reference)

### User
- **Table**: `users`
- **Key Fields**: `id`, `email`, `name`
- **Relationships**: Has many Shops

### Shop
- **Table**: `shops`
- **Key Fields**: `id`, `user_id`, `name`, `type`, `settings`
- **Relationships**: Belongs to User, Has many Reviews, Has many Posts

### Review (Existing - Extended)
- **Table**: `reviews`
- **Key Fields**: `id`, `shop_id`, `google_review_id`, `rating`, `content`, `status`, `ai_response`, `final_response`
- **Status Values**: `pending`, `replied`, `ignored`
- **Relationships**: Belongs to Shop

## New Entities

### Post (Instagram Post)

**Table**: `posts`

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `shop_id` | UUID | No | FK to shops.id |
| `instagram_post_id` | VARCHAR(255) | Yes | External Instagram post ID (null until published) |
| `status` | ENUM | No | draft, scheduled, published, failed |
| `image_url` | VARCHAR(500) | No | Uploaded image URL (S3/Supabase Storage) |
| `caption` | TEXT | Yes | Post caption text |
| `hashtags` | JSON | No | Array of hashtags, default [] |
| `scheduled_at` | TIMESTAMP | Yes | When post is scheduled to publish |
| `published_at` | TIMESTAMP | Yes | When post was actually published |
| `likes_count` | INTEGER | No | Engagement: likes, default 0 |
| `comments_count` | INTEGER | No | Engagement: comments, default 0 |
| `reach_count` | INTEGER | No | Engagement: reach, default 0 |
| `engagement_synced_at` | TIMESTAMP | Yes | Last time engagement was synced |
| `error_message` | TEXT | Yes | Error details if status=failed |
| `created_at` | TIMESTAMP | No | Record creation time |
| `updated_at` | TIMESTAMP | No | Record update time |

**Indexes**:
- `idx_posts_shop_id` on `shop_id`
- `idx_posts_status` on `status`
- `idx_posts_scheduled_at` on `scheduled_at`
- `idx_posts_instagram_post_id` on `instagram_post_id` (unique where not null)

**State Transitions**:
```
draft → scheduled → published
              ↓
           failed → scheduled (retry)
```

### Review Entity Updates

**New Index for Dashboard Queries**:
- `idx_reviews_shop_status` on `(shop_id, status)` - optimizes pending reviews lookup
- `idx_reviews_shop_date` on `(shop_id, review_date)` - optimizes trend queries

**No schema changes** - existing Review model supports all dashboard requirements.

## Aggregation Schemas (Runtime/Cached)

These are not persisted tables but represent the shape of aggregated data:

### ReviewStats (Computed)

```python
class ReviewStats:
    total_reviews: int
    average_rating: float  # 1.0-5.0
    response_rate: float   # 0.0-100.0 percentage
    pending_count: int
    by_platform: dict[str, PlatformStats]  # {"google": {...}, "naver": {...}}
    last_synced_at: datetime
```

### PostingCalendarEntry (Computed)

```python
class PostingCalendarEntry:
    date: date
    posts: list[PostSummary]  # id, status, image_url, caption_snippet

class PostSummary:
    id: UUID
    status: str
    image_url: str
    caption_snippet: str  # First 50 chars
    scheduled_at: datetime | None
    published_at: datetime | None
```

### EngagementSummary (Computed)

```python
class EngagementSummary:
    total_likes: int
    total_comments: int
    total_reach: int
    top_posts: list[TopPost]  # Top 5 by engagement
    last_synced_at: datetime

class TopPost:
    id: UUID
    image_url: str
    likes_count: int
    comments_count: int
    reach_count: int
    engagement_score: int  # likes + comments*2 + reach*0.1
```

### TrendDataPoint (Computed)

```python
class TrendDataPoint:
    date: date
    review_count: int
    average_rating: float
    response_rate: float

class TrendData:
    period: str  # "week", "month", "year"
    data_points: list[TrendDataPoint]
```

## Validation Rules

### Post
- `image_url` MUST be a valid URL
- `scheduled_at` MUST be in the future when status=scheduled
- `status` changes MUST follow state transition rules
- `hashtags` MUST be an array of strings, max 30 items (Instagram limit)
- `caption` MUST be <= 2200 characters (Instagram limit)

### Review (Dashboard Context)
- `status` MUST be one of: pending, replied, ignored
- `ai_response` populated only after AI generation
- `final_response` populated only after user approval

## Migration Plan

### New Migration: Add Posts Table

```sql
-- Migration: 001_create_posts_table.sql

CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'published', 'failed');

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    instagram_post_id VARCHAR(255) UNIQUE,
    status post_status NOT NULL DEFAULT 'draft',
    image_url VARCHAR(500) NOT NULL,
    caption TEXT,
    hashtags JSONB NOT NULL DEFAULT '[]',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    likes_count INTEGER NOT NULL DEFAULT 0,
    comments_count INTEGER NOT NULL DEFAULT 0,
    reach_count INTEGER NOT NULL DEFAULT 0,
    engagement_synced_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_shop_id ON posts(shop_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_scheduled_at ON posts(scheduled_at);
```

### New Migration: Add Review Indexes

```sql
-- Migration: 002_add_review_dashboard_indexes.sql

CREATE INDEX idx_reviews_shop_status ON reviews(shop_id, status);
CREATE INDEX idx_reviews_shop_date ON reviews(shop_id, review_date);
```

## Query Patterns

### Dashboard Load (Single Shop)

```sql
-- Review stats (single query)
SELECT
    COUNT(*) as total_reviews,
    AVG(rating) as average_rating,
    COUNT(*) FILTER (WHERE status = 'replied') * 100.0 / NULLIF(COUNT(*), 0) as response_rate,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count
FROM reviews
WHERE shop_id = :shop_id;

-- Posts for calendar (date range)
SELECT id, status, image_url, LEFT(caption, 50) as caption_snippet,
       scheduled_at, published_at, DATE(COALESCE(scheduled_at, published_at)) as display_date
FROM posts
WHERE shop_id = :shop_id
  AND COALESCE(scheduled_at, published_at) BETWEEN :start_date AND :end_date
ORDER BY display_date;

-- Top posts by engagement
SELECT id, image_url, likes_count, comments_count, reach_count,
       (likes_count + comments_count * 2 + reach_count / 10) as engagement_score
FROM posts
WHERE shop_id = :shop_id AND status = 'published'
ORDER BY engagement_score DESC
LIMIT 5;

-- Trend data (daily aggregation)
SELECT DATE(review_date) as date,
       COUNT(*) as review_count,
       AVG(rating) as average_rating,
       COUNT(*) FILTER (WHERE status = 'replied') * 100.0 / NULLIF(COUNT(*), 0) as response_rate
FROM reviews
WHERE shop_id = :shop_id
  AND review_date >= :start_date
GROUP BY DATE(review_date)
ORDER BY date;
```
