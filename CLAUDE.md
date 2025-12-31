# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SalonMate is an AI-powered marketing automation platform for beauty/salon businesses (nail shops, hair salons, skin care). Core features: AI review responses, Instagram auto-posting, marketing dashboard.

## Commands

### Backend
```bash
cd src/backend
source venv/bin/activate
./venv/bin/ruff check .              # Lint
./venv/bin/ruff format .             # Format
./venv/bin/python -m pytest          # Run all tests
./venv/bin/python -m pytest tests/api/v1/test_auth.py -v  # Single test file
./venv/bin/python -m pytest -k "test_login"               # Tests matching pattern
./venv/bin/python -m mypy .          # Type check
alembic upgrade head                 # Run migrations
alembic revision --autogenerate -m "description"  # Create migration
uvicorn main:app --reload            # Dev server (port 8000)
```

### Frontend
```bash
cd src/frontend
pnpm install                         # Install dependencies
pnpm dev                             # Dev server (port 3000)
pnpm lint                            # ESLint
pnpm type-check                      # TypeScript check
pnpm test                            # Vitest
pnpm test tests/SocialLogin.test.tsx # Single test file
pnpm build                           # Production build
```

### Docker (Full Stack)
```bash
docker-compose up -d                 # Start all services
docker-compose up -d postgres redis  # Start only DB services
docker-compose --profile dev-tools up -d  # Include Adminer & Redis Commander
```

## Architecture

### Backend (FastAPI + SQLAlchemy 2.0)

**Request Flow:**
```
api/v1/*.py (routes) → services/*.py (business logic) → models/*.py (ORM) → PostgreSQL
     ↓                        ↓
schemas/*.py (validation)  core/security.py (auth)
```

**Key Patterns:**
- **App Factory**: `main.py` uses `create_app()` with lifespan management
- **Dependency Injection**: Services instantiated via `Depends(get_db)` pattern
- **Async Database**: All DB operations use `AsyncSession` with SQLAlchemy 2.0 `select()` API
- **Settings Singleton**: `config/settings.py` uses `@lru_cache` for single instance

**Service Pattern:**
```python
class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def signup(self, data: UserCreate) -> AuthResponse:
        # Business logic here

    async def _get_user_by_email(self, email: str) -> Optional[User]:
        # Helper methods prefixed with underscore
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()
```

**Schema Pattern (camelCase API):**
```python
class AuthResponse(BaseModel):
    access_token: str = Field(alias="accessToken")
    model_config = {"from_attributes": True, "populate_by_name": True}
```

**Model Pattern (SQLAlchemy 2.0):**
```python
class User(BaseModel):  # Inherits UUID + timestamps
    __tablename__ = "users"
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    shops: Mapped[list["Shop"]] = relationship(back_populates="owner")
```

### Frontend (Next.js 16 + React 19)

**Structure:**
```
src/app/          # App Router pages (layout.tsx is root)
src/components/   # React components (use 'use client' for interactive)
src/lib/api/      # API client modules (fetchWithAuth wrapper)
src/stores/       # Zustand stores with persist middleware
src/types/        # TypeScript interfaces
```

**API Client Pattern:**
```typescript
// src/lib/api/client.ts - Base fetch wrapper
export async function fetchWithAuth<T>(path: string, options?: RequestInit): Promise<T>

// src/lib/api/dashboard.ts - Domain-specific module
export async function fetchDashboard(shopId: string) {
  return fetchWithAuth<DashboardResponse>(`/dashboard/${shopId}`);
}
```

**State Management:**
- **Server State**: TanStack Query (60s stale time, no refetch on focus)
- **Client State**: Zustand with localStorage persistence
- **Auth Tokens**: Stored in localStorage, injected via `fetchWithAuth`

**Provider Hierarchy** (in `layout.tsx`):
```
AppRouterCacheProvider → Providers (QueryClient + Theme) → Header → {children} → Toaster
```

### Database

- **Primary**: PostgreSQL 16 (Supabase in production)
- **Cache/Queue**: Redis 7 (Upstash in production)
- **Migrations**: Alembic in `src/backend/alembic/`

### Authentication

- JWT tokens: Access (30 min) + Refresh (7 days)
- OAuth providers: Google, Kakao
- Password hashing: bcrypt with 72-byte truncation

## Code Style

### Python
- Ruff for linting/formatting (line length 88)
- Type hints required (`disallow_untyped_defs = true` in mypy)
- Use `async/await` with `AsyncSession` for all DB operations

### TypeScript
- Strict mode enabled
- Import via `@/` alias (e.g., `@/components/Button`)
- Use `'use client'` directive for components with interactivity

## Git Workflow

- **Never push directly to main** - always use feature branches → PR → merge
- Branch naming: `feature/기능명`, `fix/버그명`, `chore/작업명`
- Squash merge for clean history
- Conventional commits: `feat(scope):`, `fix(scope):`, `docs(scope):`

## Environment Variables

### Backend (required)
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT signing key
- `GOOGLE_CLIENT_ID/SECRET` - OAuth
- `KAKAO_CLIENT_ID/SECRET` - OAuth
- `OPENAI_API_KEY` - AI features

### Frontend (required)
- `NEXT_PUBLIC_API_URL` - Backend URL (default: http://localhost:8000/api/v1)

## Testing

### Backend
- pytest with `asyncio_mode = "auto"`
- In-memory SQLite for test isolation
- Fixtures in `tests/conftest.py` for DB sessions

### Frontend
- Vitest for unit tests
- Playwright for E2E tests
- Coverage target: 80%

## Current Status (v0.5.0)

### Implemented
- Marketing Dashboard (review stats, posting calendar, engagement metrics)
- Content Studio (post editor, AI Studio, Media Library)
- Reviews (list, detail, analytics)
- Settings (profile, shops, integrations, notifications, billing, team)
- Onboarding (5-step wizard)
- OAuth (Google, Kakao)

### Pending Backend Work
- Issue #74: AI image generation API
- Issue #75: Media library API
- Issue #76: Cloud storage setup
- Issue #77: Vercel environment variables
