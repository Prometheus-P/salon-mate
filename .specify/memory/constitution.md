<!--
================================================================================
SYNC IMPACT REPORT
================================================================================
Version Change: N/A → 1.0.0 (Initial adoption)

Modified Principles: N/A (Initial version)

Added Sections:
  - Core Principles (7 principles)
  - Technology Standards
  - Development Workflow
  - Governance

Removed Sections: N/A (Initial version)

Templates Validation:
  - .specify/templates/plan-template.md: ✅ Compatible (Constitution Check section present)
  - .specify/templates/spec-template.md: ✅ Compatible (Requirements align with principles)
  - .specify/templates/tasks-template.md: ✅ Compatible (Test-first workflow supported)
  - .specify/templates/checklist-template.md: ✅ Compatible (Generic template)
  - .specify/templates/agent-file-template.md: ✅ Compatible (Generic template)

Follow-up TODOs: None
================================================================================
-->

# SalonMate Constitution

## Core Principles

### I. Test-First Development (NON-NEGOTIABLE)

Test-Driven Development (TDD) is mandatory for all production code.

- Tests MUST be written before implementation code
- Tests MUST fail before implementation (Red phase)
- Implementation MUST only satisfy failing tests (Green phase)
- Refactoring MUST NOT change test behavior (Refactor phase)
- Code coverage MUST be at least 80% for new features
- No pull request MUST be merged without passing tests

**Rationale**: TDD ensures code correctness, enables confident refactoring, and produces
self-documenting test suites. For an AI-powered marketing platform handling customer data,
this discipline prevents regressions and maintains reliability.

### II. API-First Design

All backend functionality MUST be designed as API contracts before implementation.

- OpenAPI/Swagger specifications MUST be defined before endpoint implementation
- Frontend and backend teams MUST agree on contracts before parallel development
- Breaking changes MUST follow semantic versioning and deprecation cycles
- All API endpoints MUST have documented request/response schemas

**Rationale**: API-first enables parallel frontend/backend development, ensures clear
contracts between services, and supports future mobile app development via Capacitor.

### III. Security & Privacy

User data protection is paramount for a platform handling salon business information.

- Authentication MUST use JWT with proper expiration and refresh token rotation
- All user inputs MUST be validated and sanitized (OWASP Top 10 compliance)
- Sensitive data MUST be encrypted at rest and in transit
- API keys and secrets MUST NEVER be committed to version control
- OAuth integrations (Naver, Google) MUST follow provider security guidelines
- User consent MUST be obtained before AI processing of customer reviews

**Rationale**: SalonMate handles sensitive business data (customer reviews, marketing content,
business metrics). Security breaches would destroy user trust and violate privacy regulations.

### IV. Observability

All services MUST be observable and debuggable in production.

- Structured logging (JSON format) MUST be implemented for all services
- Error tracking via Sentry MUST capture exceptions with context
- Performance metrics MUST be collected for API endpoints (p50, p95, p99 latency)
- AI service calls (OpenAI) MUST log request/response times and token usage
- Celery task queues MUST have visibility into job status and failures

**Rationale**: AI services can fail unpredictably. Observability enables rapid diagnosis
of issues with review responses, Instagram posting, or other automated marketing features.

### V. Simplicity (YAGNI)

Code MUST be kept simple and focused on current requirements.

- Features MUST NOT be built speculatively for hypothetical future needs
- Abstractions MUST NOT be created until at least three use cases exist
- Configuration options MUST be limited to what users actually need
- Technology choices MUST prefer proven solutions over novel approaches
- Code comments MUST explain "why," not "what"

**Rationale**: Over-engineering creates maintenance burden and slows development.
Start simple, iterate based on real user feedback and measured needs.

### VI. Versioning & Breaking Changes

All changes MUST follow semantic versioning principles.

- API versions MUST use URL path versioning (e.g., /api/v1/)
- MAJOR bumps MUST be used for breaking changes requiring client updates
- MINOR bumps MUST be used for backward-compatible new features
- PATCH bumps MUST be used for backward-compatible bug fixes
- Deprecated endpoints MUST provide migration guides and sunset dates

**Rationale**: SalonMate will have external integrations (Naver API, Instagram API).
Clear versioning prevents surprise breakages for integrated services.

### VII. Code Quality Gates

All code MUST pass quality gates before merging.

- TypeScript code MUST have zero type errors
- Python code MUST pass mypy type checking (strict mode)
- ESLint/Pylint MUST report zero warnings
- Prettier/Black formatting MUST be applied consistently
- No commented-out code MUST be committed
- Pull requests MUST be reviewed by at least one team member

**Rationale**: Consistent code quality reduces cognitive load, prevents bugs,
and ensures the codebase remains maintainable as the team scales.

## Technology Standards

### Frontend Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5.x (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand for client state, TanStack Query for server state
- **Testing**: Vitest + React Testing Library
- **Mobile**: Capacitor for iOS/Android builds

### Backend Stack

- **Framework**: FastAPI (Python 3.12)
- **ORM**: SQLAlchemy 2.0 with Alembic migrations
- **Authentication**: JWT + OAuth 2.0 (Naver, Google)
- **Task Queue**: Celery with Redis broker
- **Testing**: pytest with pytest-asyncio

### Infrastructure

- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel (frontend) + Railway (backend)
- **Cache**: Redis (Upstash)
- **Monitoring**: Sentry (errors) + Datadog (metrics)

## Development Workflow

### Branch Strategy

- `main`: Production-ready code, protected branch
- `develop`: Integration branch for feature work
- `feature/*`: Individual feature branches
- `hotfix/*`: Emergency production fixes
- `release/*`: Release preparation branches

### Commit Standards

All commits MUST follow Conventional Commits format:

```
<type>(<scope>): <subject>

Types: feat, fix, docs, style, refactor, test, chore
Scope: review, instagram, auth, dashboard, etc.
```

### Code Review Requirements

- Minimum one approval required for merge
- All CI checks MUST pass
- Test coverage MUST NOT decrease
- Security scan MUST NOT introduce new vulnerabilities

## Governance

### Amendment Process

1. Propose changes via pull request to this constitution
2. Document rationale for changes
3. Obtain team consensus (majority approval)
4. Update version number according to semantic versioning
5. Propagate changes to dependent templates if affected

### Compliance Review

- All pull requests MUST verify compliance with these principles
- Architecture decisions MUST reference relevant principles
- Complexity additions MUST be justified against Simplicity principle
- Security-related changes MUST undergo additional review

### Versioning Policy

- **MAJOR**: Backward-incompatible governance changes, principle removals
- **MINOR**: New principles added, existing principles materially expanded
- **PATCH**: Clarifications, wording improvements, typo fixes

**Version**: 1.0.0 | **Ratified**: 2025-12-02 | **Last Amended**: 2025-12-02
