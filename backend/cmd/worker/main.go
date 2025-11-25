package main

import (
	"log/slog"
	"os"
)

func main() {
	// 로거 설정
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	slog.Info("Starting Asynq worker...")

	// TODO: Asynq worker 설정
	// Redis 연결 및 태스크 핸들러 등록

	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://localhost:6379"
	}

	slog.Info("Worker configuration", "redis_url", redisURL)

	// Placeholder: Worker 실행
	select {}
}
