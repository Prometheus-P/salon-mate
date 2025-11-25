.PHONY: build run test lint clean migrate

# Go parameters
GOCMD=go
GOBUILD=$(GOCMD) build
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
GOMOD=$(GOCMD) mod
BINARY_API=bin/api
BINARY_WORKER=bin/worker

# Build targets
build: build-api build-worker

build-api:
	$(GOBUILD) -o $(BINARY_API) -v ./cmd/api

build-worker:
	$(GOBUILD) -o $(BINARY_WORKER) -v ./cmd/worker

# Run targets
run:
	$(GOCMD) run ./cmd/api/main.go

run-worker:
	$(GOCMD) run ./cmd/worker/main.go

# Test targets
test:
	$(GOTEST) -v ./...

test-coverage:
	$(GOTEST) -v -coverprofile=coverage.out ./...
	$(GOCMD) tool cover -html=coverage.out -o coverage.html

# Linting
lint:
	golangci-lint run ./...

# Dependencies
deps:
	$(GOMOD) download
	$(GOMOD) tidy

# Database migrations
migrate-up:
	migrate -path db/migrations -database "$(DATABASE_URL)" up

migrate-down:
	migrate -path db/migrations -database "$(DATABASE_URL)" down

migrate-create:
	@read -p "Enter migration name: " name; \
	migrate create -ext sql -dir db/migrations -seq $$name

# SQLC code generation
sqlc:
	sqlc generate

# Clean
clean:
	rm -rf bin/
	rm -f coverage.out coverage.html

# Development
dev: deps
	air -c .air.toml

# Docker
docker-build:
	docker build -f ../infra/docker/Dockerfile.api -t salonmate-api .

# Help
help:
	@echo "Available targets:"
	@echo "  build         - Build all binaries"
	@echo "  build-api     - Build API server"
	@echo "  build-worker  - Build worker"
	@echo "  run           - Run API server"
	@echo "  run-worker    - Run worker"
	@echo "  test          - Run tests"
	@echo "  test-coverage - Run tests with coverage"
	@echo "  lint          - Run linter"
	@echo "  deps          - Download dependencies"
	@echo "  migrate-up    - Run database migrations"
	@echo "  migrate-down  - Rollback database migrations"
	@echo "  migrate-create- Create new migration"
	@echo "  sqlc          - Generate SQLC code"
	@echo "  clean         - Clean build artifacts"
	@echo "  dev           - Run with hot reload (air)"
