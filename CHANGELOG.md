# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- 구글 리뷰 자동 답변 기능
- 네이버 리뷰 답변 생성 기능
- Google OAuth 인증
- Kakao OAuth 인증

---

## [0.5.0] - 2025-12-23

### Added
- **Content Studio Editor Components**
  - `InstagramPreview` - Instagram 앱 UI 시뮬레이션 (다크/라이트 모드)
  - `CaptionEditor` - 이모지 피커 및 AI 캡션 생성 지원
  - `HashtagInput` - 카테고리별 해시태그 추천 (업종, 위치, 트렌드, AI)
  - `SchedulePicker` - 캘린더/시간 선택기 및 최적 시간 표시
  - `MediaUploader` - 드래그앤드롭, 파일 검증, 그리드 재정렬
  - `PostEditor` - 통합 2컬럼 레이아웃 에디터

- **AI Studio Page** (`/dashboard/instagram/ai-studio`)
  - 3단계 위자드: 콘텐츠 유형 → 주제 입력 → 스타일 선택
  - AI 이미지 생성 및 캡션/해시태그 추천
  - 생성 결과 그리드 및 포스트 작성 연동

- **Media Library Page** (`/dashboard/instagram/media`)
  - 미디어 파일 관리 (이미지/동영상/AI생성)
  - 폴더 구조 및 생성 기능
  - 다중 선택 및 일괄 작업 (삭제, 이동, 포스트 생성)
  - 검색 및 필터 기능

- **Post Edit Page** (`/dashboard/instagram/[id]/edit`)
  - 기존 포스트 수정 기능
  - PostEditor 컴포넌트 활용

- **New UI Components**
  - `calendar.tsx` - react-day-picker v9 기반 캘린더
  - `radio-group.tsx` - Radix UI 라디오 그룹
  - `separator.tsx` - Radix UI 구분선

- **API & Hooks**
  - AI 이미지 생성 API (`generateAIImage`)
  - 미디어 CRUD API (`media.ts`)
  - TanStack Query 훅 (`useMedia.ts`, `useGenerateAIImage`)

### Changed
- 포스트 생성 페이지 리팩토링 (PostEditor 컴포넌트 사용)

---

## [0.4.3] - 2025-12-23

### Fixed
- Added missing type annotations to 22+ API endpoint functions
- Fixed mypy type errors across backend codebase
- Resolved ruff lint errors (unused imports, formatting)
- Added Suspense boundary for Next.js stylebook page
- Fixed alembic migration duplicate type annotation error

### Changed
- Improved type safety in `api/v1/posts.py`, `api/v1/settings.py`, `api/v1/onboarding.py`
- Enhanced middleware type annotations in `middleware/timing.py`
- Cleaned up `services/onboarding_service.py` to remove non-existent User attributes

---

## [0.4.2] - 2025-12-22

### Changed
- Updated README to reflect proprietary license
- Fixed ruff format issue in middleware/timing.py
- Added sentry-sdk to requirements.txt

---

## [0.4.1] - 2025-12-22

### Changed
- License changed from MIT to Proprietary Business License
- Updated license contact email

---

## [0.4.0] - 2025-12-22

### Added
- Instagram Graph API integration for direct posting and engagement sync
- Vision AI stylebook features for automatic style tag detection
- Sentry error tracking integration for backend monitoring
- Performance monitoring and verification system
- CodeQL security scanning workflow
- Playwright E2E tests for main user flows (dashboard, onboarding, reviews, settings)
- API tests for Settings, Onboarding, and Posts endpoints
- Toast notifications with optimistic updates for publish actions

### Changed
- Enhanced dashboard with shop selector improvements
- Updated frontend dependencies and vitest config
- Improved migrations for SQLite compatibility

### Fixed
- Mypy type annotations for CI compliance
- Ruff linter import sorting issues
- bcrypt password handling for cross-version compatibility

### Security
- Added CodeQL analysis for vulnerability scanning

---

## [0.3.0] - 2025-12-02

### Added
- Marketing Dashboard feature implementation (#47)
- Material Design 3 tokens and theme support
- WCAG AA color contrast verification
- Reviews, Content Studio, Settings, and Onboarding phases (1-4)
- Complete frontend component library (Badge, Dialog, Dropdown, Tabs, etc.)
- API endpoints for reviews, settings, onboarding, posts, styles
- Instagram and Stylebook pages with full CRUD
- Screen definition documents for all features

### Changed
- Updated M3 design system styling across components
- Enhanced UI component inventory
- Migrated from MUI to shadcn/ui components

---

## [0.2.0] - 2025-11-27

### Added

#### Authentication (Sprint 2)
- 이메일 회원가입 API (`POST /v1/auth/signup`)
- 이메일 로그인 API (`POST /v1/auth/login`)
- JWT 액세스 토큰 발급 (30분 유효)
- JWT 리프레시 토큰 발급 (7일 유효)
- 토큰 갱신 API (`POST /v1/auth/refresh`)
- 로그아웃 API (`POST /v1/auth/logout`)
- bcrypt 비밀번호 해싱

#### Testing
- pytest + pytest-asyncio 테스트 인프라
- 회원가입 테스트 (9 tests)
- 로그인 테스트 (7 tests)
- 토큰 갱신 테스트 (5 tests)
- aiosqlite를 사용한 인메모리 테스트 DB

#### Core Modules
- `core/security.py`: 비밀번호 해싱, JWT 토큰 생성/검증
- `services/auth_service.py`: 인증 비즈니스 로직
- `models/base.py`: GUID TypeDecorator (크로스 DB 호환)

### Changed
- `models/base.py`: PostgreSQL UUID를 String(36) GUID로 변경 (SQLite 호환)
- `requirements.txt`: bcrypt 버전 고정 (4.0.0 ~ 5.0.0)

---

## [0.1.0] - 2025-11-27

### Added

#### Infrastructure
- 프로젝트 초기 설정 및 문서화
- Frontend: Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui 초기화
- Backend: FastAPI (Python 3.12) + SQLAlchemy 2.0 초기화
- Supabase 연동 및 마이그레이션 인프라 구축

#### Documentation
- PRD (제품 요구사항 문서) 작성
- ARCHITECTURE.md (시스템 아키텍처) 문서화
- API_SPEC.md (API 명세) 정의
- DATA_MODEL.md (데이터 모델) 설계
- CONTEXT.md (프로젝트 컨텍스트) 작성
- CONTRIBUTING.md (기여 가이드) 작성
- CODE_REVIEW_GUIDE.md (코드 리뷰 가이드) 작성
- VERSIONING_GUIDE.md (버전 관리 가이드) 작성
- ENVIRONMENT.md (환경 설정) 문서화

#### DevOps
- GitHub 이슈/PR 템플릿 설정
- SECURITY.md 보안 정책 수립

### Dependencies

#### Frontend
- next: 16.0.4
- react: 19.2.0
- react-dom: 19.2.0
- @tanstack/react-query: 5.90.11
- zustand: 5.0.8
- tailwindcss: 4.x
- typescript: 5.x

#### Backend
- Python: 3.12
- FastAPI (계획)
- SQLAlchemy 2.0 (계획)
- Pydantic v2 (계획)

---

## Version History Summary

| Version | Date | Description |
|---------|------|-------------|
| 0.4.3 | 2025-12-23 | CI lint/type 오류 수정 |
| 0.4.2 | 2025-12-22 | README 및 CI 수정 |
| 0.4.1 | 2025-12-22 | 라이센스 변경 (MIT → Proprietary) |
| 0.4.0 | 2025-12-22 | Sprint 5 - Instagram API, Vision AI, E2E 테스트, 모니터링 |
| 0.3.0 | 2025-12-02 | Sprint 3-4 - Marketing Dashboard, Reviews, Settings, Onboarding |
| 0.2.0 | 2025-11-27 | Sprint 2 - 이메일 인증 시스템 (회원가입, 로그인, JWT) |
| 0.1.0 | 2025-11-27 | 초기 프로젝트 설정 및 인프라 구축 |

---

[Unreleased]: https://github.com/Prometheus-P/salon-mate/compare/v0.4.3...HEAD
[0.4.3]: https://github.com/Prometheus-P/salon-mate/compare/v0.4.2...v0.4.3
[0.4.2]: https://github.com/Prometheus-P/salon-mate/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/Prometheus-P/salon-mate/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/Prometheus-P/salon-mate/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/Prometheus-P/salon-mate/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Prometheus-P/salon-mate/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Prometheus-P/salon-mate/releases/tag/v0.1.0

*🤖 Generated with [Claude Code](https://claude.com/claude-code)*
