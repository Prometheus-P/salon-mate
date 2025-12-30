# salon-mate Development Guidelines

Last updated: 2025-12-23 | Version: 0.5.0

## Active Technologies

### Backend
- Python 3.12
- FastAPI
- SQLAlchemy 2.0
- Alembic (migrations)
- Ruff (linting/formatting)
- Mypy (type checking)
- Pytest

### Frontend
- TypeScript 5.x
- Next.js 16 (App Router, Turbopack)
- TanStack Query v5
- Zustand (state management)
- shadcn/ui + Radix UI
- Recharts
- Tailwind CSS v4

## Project Structure

```text
salon-mate/
├── src/
│   ├── backend/           # FastAPI backend
│   │   ├── api/v1/        # API endpoints
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   ├── alembic/       # Database migrations
│   │   └── tests/         # Backend tests
│   └── frontend/          # Next.js frontend
│       ├── src/app/       # App Router pages
│       ├── src/components/ # UI components
│       ├── src/lib/       # Utilities, API clients
│       ├── src/stores/    # Zustand stores
│       └── __tests__/     # Frontend tests
├── specs/                 # Feature specifications
└── docs/                  # Documentation
```

## Commands

### Backend
```bash
cd src/backend
source venv/bin/activate
./venv/bin/ruff check .              # Lint
./venv/bin/ruff format .             # Format
./venv/bin/python -m pytest          # Test
./venv/bin/python -m mypy .          # Type check
alembic upgrade head                  # Run migrations
```

### Frontend
```bash
cd src/frontend
pnpm install                          # Install dependencies
pnpm lint                             # ESLint
pnpm type-check                       # TypeScript check
pnpm test                             # Vitest
pnpm build                            # Production build
pnpm dev                              # Development server
```

### Deployment
```bash
cd src/frontend
vercel --prod                         # Deploy to Vercel
```

## Code Style

### Python
- Follow PEP 8 (enforced by Ruff)
- Type hints required for all functions
- Docstrings for public APIs

### TypeScript
- Strict mode enabled
- Prefer functional components with hooks
- Use `'use client'` directive for client components

## Current Features

### Implemented (v0.5.0)
- **Marketing Dashboard**: Review stats, posting calendar, engagement metrics
- **Content Studio**: Post editor, AI Studio, Media Library
- **Reviews**: List, detail, analytics
- **Settings**: Profile, shops, integrations, notifications, billing, team
- **Onboarding**: 5-step wizard

### Pending Backend Implementation
- Issue #74: AI 이미지 생성 API
- Issue #75: 미디어 라이브러리 API
- Issue #76: 클라우드 스토리지 설정
- Issue #77: Vercel 환경 변수 설정

## Git Workflow

- **main 브랜치에 직접 push 절대 금지**
- 모든 변경사항은 feature 브랜치 생성 → PR 생성 → CI 통과 → 병합
- 브랜치 네이밍: `feature/기능명`, `fix/버그명`, `chore/작업명`
- Squash merge 사용

## Deployment

- **Platform**: Vercel
- **Production URL**: https://frontend-8znfq3r0t-prometheusps-projects.vercel.app
- **Auto Deploy**: main 브랜치 push 시 자동 배포

## Environment Variables

### Frontend (Vercel)
| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN | No |

### Backend
| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection | Yes |
| `SECRET_KEY` | JWT secret | Yes |
| `AWS_ACCESS_KEY_ID` | S3 access | For media |
| `AWS_SECRET_ACCESS_KEY` | S3 secret | For media |
| `OPENAI_API_KEY` | AI features | For AI |

---

## Vibe Coding: Effective AI Collaboration

### Philosophy

**"AI is a Pair Programming Partner, Not Just a Tool"**

Collaboration with Claude is not mere code generation—it's a process of sharing thought processes and solving problems together.

### 1. Context Provision Principles

**Provide Sufficient Background:**
```markdown
# BAD: No context
"Create a login feature"

# GOOD: Rich context
"Our project uses Next.js 14 + Supabase.
Auth-related code is in /app/auth folder.
Following existing patterns, add OAuth login.
Reference: src/app/auth/login/page.tsx"
```

**Context Checklist:**
- [ ] Specify project tech stack
- [ ] Provide relevant file paths
- [ ] Mention existing patterns/conventions
- [ ] Describe expected output format
- [ ] State constraints and considerations

### 2. Iterative Refinement Cycle

```
VIBE CODING CYCLE

1. SPECIFY    → Describe desired functionality specifically
2. GENERATE   → Claude generates initial code
3. REVIEW     → Review generated code yourself
4. REFINE     → Provide feedback for modifications
5. VERIFY     → Run tests and verify edge cases

Repeat 2-5 as needed
```

### 3. Effective Prompt Patterns

**Pattern 1: Role Assignment**
```
"You are a senior React developer with 10 years experience.
Review this component and suggest improvements."
```

**Pattern 2: Step-by-Step Requests**
```
"Proceed in this order:
1. Analyze current code problems
2. Present 3 improvement options
3. Refactor using the most suitable option
4. Explain the changes"
```

**Pattern 3: Constraint Specification**
```
"Implement with these constraints:
- Maintain existing API contract
- No new dependencies
- Test coverage >= 80%"
```

**Pattern 4: Example-Based Requests**
```
"Create OrderService.ts following the same pattern as
UserService.ts. Especially follow the error handling approach."
```

### 4. Boundaries

**DO NOT delegate to Claude:**
- Security credential generation/management
- Direct production DB manipulation
- Code deployment without verification
- Sensitive business logic full delegation

**Human verification REQUIRED:**
- Security-related code (auth, permissions)
- Financial transaction logic
- Personal data processing code
- Irreversible operations
- External API integration code

### 5. Vibe Coding Checklist

```
Before Starting:
- [ ] Shared CLAUDE.md file with Claude?
- [ ] Explained project structure and conventions?
- [ ] Clearly defined task objectives?

During Coding:
- [ ] Providing sufficient context?
- [ ] Understanding generated code?
- [ ] Giving specific feedback?

After Coding:
- [ ] Personally reviewed generated code?
- [ ] Ran tests?
- [ ] Verified security-related code?
- [ ] Removed AI mentions from commit messages?
```

