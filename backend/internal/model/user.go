package model

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID  `json:"id"`
	Email        string     `json:"email"`
	PasswordHash string     `json:"-"`
	Name         string     `json:"name"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	DeletedAt    *time.Time `json:"-"`
}

type Shop struct {
	ID            uuid.UUID `json:"id"`
	UserID        uuid.UUID `json:"user_id"`
	Name          string    `json:"name"`
	Type          string    `json:"type"`
	Address       string    `json:"address,omitempty"`
	GooglePlaceID string    `json:"google_place_id,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type ShopType string

const (
	ShopTypeHairSalon   ShopType = "hair_salon"
	ShopTypeNailSalon   ShopType = "nail_salon"
	ShopTypeSkinCare    ShopType = "skin_care"
	ShopTypeMakeup      ShopType = "makeup"
	ShopTypeBarberShop  ShopType = "barber_shop"
	ShopTypeBeautySalon ShopType = "beauty_salon"
)
