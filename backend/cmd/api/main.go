package main

import (
	"log/slog"
	"net/http"
	"os"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	// 로거 설정
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	// Echo 인스턴스 생성
	e := echo.New()
	e.HideBanner = true

	// 미들웨어 설정
	e.Use(middleware.RequestID())
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	// Health check 엔드포인트
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{
			"status":  "healthy",
			"service": "salon-mate-api",
		})
	})

	// API v1 라우트 그룹
	v1 := e.Group("/api/v1")

	// Auth 라우트
	v1.POST("/auth/signup", func(c echo.Context) error {
		return c.JSON(http.StatusNotImplemented, map[string]string{"message": "Not implemented"})
	})
	v1.POST("/auth/login", func(c echo.Context) error {
		return c.JSON(http.StatusNotImplemented, map[string]string{"message": "Not implemented"})
	})
	v1.POST("/auth/refresh", func(c echo.Context) error {
		return c.JSON(http.StatusNotImplemented, map[string]string{"message": "Not implemented"})
	})

	// 서버 시작
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	slog.Info("Starting server", "port", port)
	if err := e.Start(":" + port); err != nil && err != http.ErrServerClosed {
		slog.Error("Failed to start server", "error", err)
		os.Exit(1)
	}
}
