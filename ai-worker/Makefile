.PHONY: install install-dev test lint format type-check run clean help

# Python environment
PYTHON := python3
PIP := pip

# Install dependencies
install:
	$(PIP) install -r requirements.txt

install-dev:
	$(PIP) install -r requirements-dev.txt

# Run tests
test:
	pytest -v

test-coverage:
	pytest --cov=src --cov-report=html --cov-report=term-missing

# Linting and formatting
lint:
	ruff check src tests

lint-fix:
	ruff check --fix src tests

format:
	black src tests
	isort src tests

format-check:
	black --check src tests
	isort --check-only src tests

# Type checking
type-check:
	mypy src

# Run all checks
check: lint format-check type-check

# Run the worker
run:
	$(PYTHON) -m src.main

# Development mode with auto-reload
dev:
	watchfiles "python -m src.main" src

# Clean up
clean:
	rm -rf __pycache__ .pytest_cache .mypy_cache .ruff_cache
	rm -rf htmlcov .coverage coverage.xml
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete

# Docker
docker-build:
	docker build -f ../infra/docker/Dockerfile.worker -t salonmate-ai-worker .

# Help
help:
	@echo "Available targets:"
	@echo "  install       - Install production dependencies"
	@echo "  install-dev   - Install development dependencies"
	@echo "  test          - Run tests"
	@echo "  test-coverage - Run tests with coverage report"
	@echo "  lint          - Run linter (ruff)"
	@echo "  lint-fix      - Run linter with auto-fix"
	@echo "  format        - Format code (black, isort)"
	@echo "  format-check  - Check code formatting"
	@echo "  type-check    - Run type checker (mypy)"
	@echo "  check         - Run all checks"
	@echo "  run           - Run the worker"
	@echo "  clean         - Clean up generated files"
	@echo "  docker-build  - Build Docker image"
