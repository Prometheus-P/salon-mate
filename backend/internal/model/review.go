package model

import (
	"time"

	"github.com/google/uuid"
)

type ReviewSource string

const (
	ReviewSourceGoogle ReviewSource = "google"
	ReviewSourceNaver  ReviewSource = "naver"
)

type ReviewStatus string

const (
	ReviewStatusPending   ReviewStatus = "pending"
	ReviewStatusResponded ReviewStatus = "responded"
	ReviewStatusIgnored   ReviewStatus = "ignored"
)

type Review struct {
	ID           uuid.UUID    `json:"id"`
	ShopID       uuid.UUID    `json:"shop_id"`
	Source       ReviewSource `json:"source"`
	ExternalID   string       `json:"external_id,omitempty"`
	Rating       int          `json:"rating"`
	Content      string       `json:"content"`
	ReviewerName string       `json:"reviewer_name"`
	Status       ReviewStatus `json:"status"`
	ReviewedAt   time.Time    `json:"reviewed_at"`
	CreatedAt    time.Time    `json:"created_at"`
	UpdatedAt    time.Time    `json:"updated_at"`
}

type ReviewResponse struct {
	ID            uuid.UUID `json:"id"`
	ReviewID      uuid.UUID `json:"review_id"`
	Content       string    `json:"content"`
	IsAIGenerated bool      `json:"is_ai_generated"`
	IsPublished   bool      `json:"is_published"`
	PublishedAt   *time.Time `json:"published_at,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
