package model

import (
	"time"

	"github.com/google/uuid"
)

type PostStatus string

const (
	PostStatusDraft      PostStatus = "draft"
	PostStatusScheduled  PostStatus = "scheduled"
	PostStatusPublished  PostStatus = "published"
	PostStatusFailed     PostStatus = "failed"
)

type Post struct {
	ID           uuid.UUID   `json:"id"`
	ShopID       uuid.UUID   `json:"shop_id"`
	Caption      string      `json:"caption"`
	Hashtags     []string    `json:"hashtags"`
	ImageURLs    []string    `json:"image_urls"`
	Status       PostStatus  `json:"status"`
	ScheduledAt  *time.Time  `json:"scheduled_at,omitempty"`
	PublishedAt  *time.Time  `json:"published_at,omitempty"`
	InstagramID  string      `json:"instagram_id,omitempty"`
	ErrorMessage string      `json:"error_message,omitempty"`
	CreatedAt    time.Time   `json:"created_at"`
	UpdatedAt    time.Time   `json:"updated_at"`
}
