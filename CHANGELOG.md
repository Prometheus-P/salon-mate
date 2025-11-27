# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- (예정) 구글 리뷰 자동 답변 기능
- (예정) 네이버 리뷰 답변 생성 기능
- (예정) 인스타그램 콘텐츠 생성 기능
- (예정) Google OAuth 인증
- (예정) Kakao OAuth 인증

### Changed
- (없음)

### Fixed
- (없음)

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
| 0.2.0 | 2025-11-27 | Sprint 2 - 이메일 인증 시스템 (회원가입, 로그인, JWT) |
| 0.1.0 | 2025-11-27 | 초기 프로젝트 설정 및 인프라 구축 |

---

*🤖 Generated with [Claude Code](https://claude.com/claude-code)*
