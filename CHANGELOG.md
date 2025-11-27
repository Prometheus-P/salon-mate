# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- (예정) 구글 리뷰 자동 답변 기능
- (예정) 네이버 리뷰 답변 생성 기능
- (예정) 인스타그램 콘텐츠 생성 기능
- (예정) 사용자 인증 (이메일, 구글, 카카오)

### Changed
- (없음)

### Fixed
- (없음)

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
| 0.1.0 | 2025-11-27 | 초기 프로젝트 설정 및 인프라 구축 |

---

*🤖 Generated with [Claude Code](https://claude.com/claude-code)*
