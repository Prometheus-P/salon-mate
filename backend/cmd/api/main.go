package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/labstack/echo/v4"
	echomw "github.com/labstack/echo/v4/middleware"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"github.com/salon-mate/backend/internal/config"
	"github.com/salon-mate/backend/internal/handler"
	"github.com/salon-mate/backend/internal/middleware"
	"github.com/salon-mate/backend/internal/repository"
	"github.com/salon-mate/backend/internal/service"
	"github.com/salon-mate/backend/pkg/validator"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to load configuration")
	}

	// Configure zerolog
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	if cfg.App.Env == "development" {
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stdout})
	}

	ctx := context.Background()

	// Initialize database
	db, err := repository.NewDB(ctx, &cfg.Database)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to database")
	}
	defer db.Close()
	log.Info().Msg("Connected to PostgreSQL")

	// Initialize Redis
	redis, err := repository.NewRedis(ctx, &cfg.Redis)
	if err != nil {
		log.Warn().Err(err).Msg("Failed to connect to Redis, continuing without cache")
	} else {
		defer redis.Close()
		log.Info().Msg("Connected to Redis")
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)

	// Initialize services
	authService := service.NewAuthService(userRepo, &cfg.JWT)

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authService)

	// Initialize middleware
	authMiddleware := middleware.NewAuthMiddleware(authService)

	// Create Echo instance
	e := echo.New()
	e.HideBanner = true
	e.Validator = validator.NewCustomValidator()

	// Global middleware
	e.Use(echomw.RequestID())
	e.Use(middleware.Logger())
	e.Use(echomw.Recover())
	e.Use(echomw.CORSWithConfig(echomw.CORSConfig{
		AllowOrigins:     []string{cfg.App.FrontendURL},
		AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete},
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
		AllowCredentials: true,
	}))

	// Health check endpoint
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"status":  "healthy",
			"service": "salon-mate-api",
			"env":     cfg.App.Env,
		})
	})

	// API v1 routes
	v1 := e.Group("/api/v1")

	// Auth routes (public)
	auth := v1.Group("/auth")
	auth.POST("/signup", authHandler.Signup)
	auth.POST("/login", authHandler.Login)
	auth.POST("/refresh", authHandler.Refresh)
	auth.POST("/logout", authHandler.Logout)

	// Protected auth routes
	auth.GET("/me", authHandler.Me, authMiddleware.RequireAuth)

	// Start server
	go func() {
		addr := ":" + cfg.App.Port
		log.Info().Str("port", cfg.App.Port).Str("env", cfg.App.Env).Msg("Starting server")
		if err := e.Start(addr); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("Failed to start server")
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info().Msg("Shutting down server...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := e.Shutdown(shutdownCtx); err != nil {
		log.Fatal().Err(err).Msg("Failed to gracefully shutdown server")
	}

	log.Info().Msg("Server stopped")
}
