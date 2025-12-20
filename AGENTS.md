# Repository Guidelines

## Project Structure & Module Organization
SalonMate keeps specs and guides in `docs/`. Runtime code lives in `src/`: the Next.js client under `src/frontend/` and the FastAPI service in `src/backend/`, whose submodules include routers (`api/`), domain logic (`domain/`), integrations (`services/`), and Celery jobs (`worker/`). Static assets stay in `public/`, while SQL/bootstrap utilities sit in `scripts/`. Backend tests live in `src/backend/tests/unit` and `tests/integration`, and frontend specs mirror components inside `src/frontend/__tests__`.

## Build, Test, and Development Commands
Use `docker-compose up -d` to boot Postgres/Redis plus both apps. Frontend workflow: `cd src/frontend && pnpm install && pnpm dev`; add `pnpm build`, `pnpm lint`, and `pnpm type-check` before pushing. Backend setup creates a venv, installs `requirements-dev.txt`, serves APIs via `uvicorn main:app --reload`, runs workers with `celery -A worker.app worker --loglevel=info`, and applies migrations through `alembic upgrade head`.

## Coding Style & Naming Conventions
TypeScript follows the repo ESLint config with 2-space indent; components use PascalCase (`BookingCard.tsx`), hooks start with `use*`, and shared utilities belong in `src/frontend/src/lib`. Run `pnpm lint:fix` to format. Python is managed by `black --line-length 88`, `ruff`, and mypy, so keep functions typed and modules descriptive (`review_service.py`). Branches follow `<type>/<issue-id>-<slug>` and secrets stay in `.env`, never hard-coded.

## Testing Guidelines
Practice TDD and update specs before features. Frontend testing uses Vitest + Testing Library via `pnpm test` (watch) or `pnpm test:ci` (coverage to `coverage/`). Backend verification relies on Pytest with `pytest -v`; execute `pytest -m integration` before shipping API or DB updates. Keep coverage ≥80% per the checklist, add regression cases for every bug, and run `pnpm test:e2e` once `docker-compose` is healthy.

## Commit & Pull Request Guidelines
Commits use Conventional Commits `<type>(<scope>): subject` with scopes such as `auth`, `review`, `instagram`, or `ui`; keep one logical change per commit and ensure lint/tests pass first. PRs link the issue, summarize deltas, list manual verification, and attach UI screenshots or GIFs when visuals shift. Confirm CI, coverage, linting, and any migration or config impact are documented before requesting review.

## Environment & Security Notes
Copy `.env.example` to `.env` and follow `ENVIRONMENT.md` for keys; never push secrets. Prefer `docker-compose` for parity, reset shared volumes with `docker compose down -v`, and read settings only through `src/backend/config/settings.py`. Rotate API tokens whenever sample data leaves the sandbox.
