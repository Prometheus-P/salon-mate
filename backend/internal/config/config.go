package config

import (
	"os"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	App      AppConfig
	Database DatabaseConfig
	Redis    RedisConfig
	JWT      JWTConfig
	OAuth    OAuthConfig
}

type AppConfig struct {
	Env         string
	Port        string
	FrontendURL string
}

type DatabaseConfig struct {
	URL             string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
}

type RedisConfig struct {
	URL string
}

type JWTConfig struct {
	Secret        string
	AccessExpiry  time.Duration
	RefreshExpiry time.Duration
}

type OAuthConfig struct {
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURI  string
	KakaoClientID      string
	KakaoClientSecret  string
	KakaoRedirectURI   string
}

func Load() (*Config, error) {
	// Load .env file if exists (for development)
	_ = godotenv.Load()

	return &Config{
		App: AppConfig{
			Env:         getEnv("APP_ENV", "development"),
			Port:        getEnv("PORT", "8080"),
			FrontendURL: getEnv("FRONTEND_URL", "http://localhost:5173"),
		},
		Database: DatabaseConfig{
			URL:             getEnv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/salonmate?sslmode=disable"),
			MaxOpenConns:    25,
			MaxIdleConns:    5,
			ConnMaxLifetime: 5 * time.Minute,
		},
		Redis: RedisConfig{
			URL: getEnv("REDIS_URL", "redis://localhost:6379"),
		},
		JWT: JWTConfig{
			Secret:        getEnv("JWT_SECRET", "dev-jwt-secret-key-min-32-characters"),
			AccessExpiry:  parseDuration(getEnv("JWT_ACCESS_EXPIRY", "15m")),
			RefreshExpiry: parseDuration(getEnv("JWT_REFRESH_EXPIRY", "168h")),
		},
		OAuth: OAuthConfig{
			GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
			GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
			GoogleRedirectURI:  getEnv("GOOGLE_REDIRECT_URI", "http://localhost:5173/auth/google/callback"),
			KakaoClientID:      getEnv("KAKAO_CLIENT_ID", ""),
			KakaoClientSecret:  getEnv("KAKAO_CLIENT_SECRET", ""),
			KakaoRedirectURI:   getEnv("KAKAO_REDIRECT_URI", "http://localhost:5173/auth/kakao/callback"),
		},
	}, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func parseDuration(s string) time.Duration {
	d, err := time.ParseDuration(s)
	if err != nil {
		return 15 * time.Minute // default
	}
	return d
}
