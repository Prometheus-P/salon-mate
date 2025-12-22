---
title: SalonMate - README
version: 0.4.2
status: Approved
owner: "@core-team"
created: 2025-11-25
updated: 2025-12-22
language: Korean (한국어)
---

# SalonMate 살롱메이트

> 뷰티/살롱 사장님을 위한 AI 마케팅 자동화 플랫폼

[![CI](https://github.com/Prometheus-P/salon-mate/workflows/CI/badge.svg)](https://github.com/Prometheus-P/salon-mate/actions)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](./LICENSE)

---

## 프로젝트 소개

SalonMate는 **네일샵, 헤어샵, 피부관리샵** 등 뷰티 업종 사장님들이 마케팅에 들이는 시간을 획기적으로 줄여주는 AI 플랫폼입니다.

### 핵심 기능

| 기능 | 설명 |
|------|------|
| **리뷰 AI 답변** | 네이버/구글 리뷰에 맞춤형 답변 자동 생성 |
| **인스타 포스팅** | 사진 업로드 → 캡션/해시태그 자동 생성 → 예약 발행 |
| **마케팅 대시보드** | 리뷰 현황, 포스팅 성과 한눈에 확인 |

### 왜 SalonMate인가?

```
기존 방식                          SalonMate 사용 시
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
리뷰 답변: 30분/일                  리뷰 답변: 1분/일 (AI 자동)
인스타 포스팅: 주 1-2회             인스타 포스팅: 매일 (자동)
블로그 대행: 월 30만원              블로그 대행: 불필요 (50%+ 절감)
```

---

## 빠른 시작

### 사전 요구사항

- **Node.js** 20.x 이상
- **Python** 3.12 이상
- **Docker** & **Docker Compose**
- **pnpm** 9.x 이상

### 1. 저장소 클론

```bash
git clone https://github.com/Prometheus-P/salon-mate.git
cd salon-mate
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
# .env 파일을 편집하여 필요한 API 키 입력
```

### 3. 의존성 설치

```bash
# Frontend
cd src/frontend
pnpm install

# Backend
cd ../backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. 로컬 개발 서버 실행

```bash
# Docker Compose로 전체 스택 실행
docker-compose up -d

# 또는 개별 실행
# Frontend (http://localhost:3000)
cd src/frontend && pnpm dev

# Backend (http://localhost:8000)
cd src/backend && uvicorn main:app --reload
```

### 5. 테스트 실행

```bash
# Frontend 테스트
cd src/frontend && pnpm test

# Backend 테스트
cd src/backend && pytest

# E2E 테스트
pnpm test:e2e
```

---

## 프로젝트 구조

```
📦 salon-mate/
├── 📄 CONTEXT.md              # 프로젝트 Single Source of Truth
├── 📄 README.md               # 이 파일
├── 📄 CHANGELOG.md            # 버전 변경 이력
├── 📄 plan.md                 # TDD 개발 계획
├── 📄 ENVIRONMENT.md          # 환경 설정 가이드
├── 📄 CONTRIBUTING.md         # 기여 가이드
├── 📄 LICENSE                 # Proprietary 라이센스
│
├── 📁 .github/                # GitHub 설정
│   ├── 📁 workflows/          # CI/CD 워크플로우
│   ├── 📁 ISSUE_TEMPLATE/     # 이슈 템플릿
│   ├── 📄 CODEOWNERS          # 코드 소유자
│   └── 📄 SECURITY.md         # 보안 정책
│
├── 📁 docs/                   # 문서
│   └── 📁 specs/              # 기술 스펙 (PRD, 아키텍처, API 등)
│
├── 📁 specs/                  # 기능 스펙 문서
│   └── 📄 *.md                # 각 기능별 스펙
│
├── 📁 src/                    # 소스 코드
│   ├── 📁 frontend/           # Next.js 16 웹앱
│   │   └── 📁 src/
│   │       ├── 📁 app/        # Next.js App Router 페이지
│   │       ├── 📁 components/ # React 컴포넌트
│   │       ├── 📁 lib/        # 유틸리티 및 API 클라이언트
│   │       ├── 📁 stores/     # Zustand 상태 관리
│   │       └── 📁 types/      # TypeScript 타입 정의
│   │
│   └── 📁 backend/            # FastAPI 서버
│       ├── 📁 api/            # API 라우터
│       ├── 📁 models/         # SQLAlchemy 모델
│       ├── 📁 schemas/        # Pydantic 스키마
│       ├── 📁 services/       # 비즈니스 로직
│       ├── 📁 core/           # 핵심 유틸리티 (보안 등)
│       ├── 📁 config/         # 설정 모듈
│       ├── 📁 middleware/     # 미들웨어
│       ├── 📁 alembic/        # DB 마이그레이션
│       ├── 📁 worker/         # AI Worker (Celery)
│       └── 📁 tests/          # 백엔드 테스트
│
├── 📁 public/                 # 정적 파일
└── 📁 scripts/                # 유틸리티 스크립트
```

---

## 기술 스택

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5.x
- **Runtime**: React 19
- **Styling**: Tailwind CSS 4.x + shadcn/ui
- **State**: Zustand 5.x + TanStack Query 5.x
- **Mobile**: Capacitor (iOS/Android)
- **Testing**: Vitest + Playwright

### Backend
- **Framework**: FastAPI (Python 3.12)
- **ORM**: SQLAlchemy 2.0 + Alembic
- **Validation**: Pydantic v2
- **Auth**: JWT + OAuth 2.0
- **Queue**: Celery + Redis
- **Linting**: Ruff + Mypy
- **Testing**: pytest + pytest-asyncio

### AI / Worker
- **LLM**: OpenAI GPT-4o
- **Vision**: OpenAI GPT-4 Vision (스타일북)
- **Framework**: LangChain + LangGraph

### Infrastructure
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel + Railway
- **Cache**: Redis (Upstash)
- **Monitoring**: Sentry
- **Security**: CodeQL

---

## 개발 가이드

### 브랜치 전략

```
main          ──────────────────────────────────────▶
                    │              │
develop       ──────┼──────────────┼────────────────▶
                    │    │    │    │
feature/*     ──────┘    │    │    │
hotfix/*                 └────┘    │
release/*                          └────────────────
```

### 커밋 메시지 규칙

```bash
<type>(<scope>): <subject>

# 예시
feat(review): add AI response generation endpoint
fix(auth): resolve token refresh race condition
docs(readme): update installation instructions
```

### 코드 리뷰 기준

- [ ] 테스트 커버리지 80% 이상
- [ ] 타입 에러 없음
- [ ] ESLint/Pylint 경고 없음
- [ ] 보안 취약점 없음

---

## 문서 목록

| 문서 | 설명 | 링크 |
|------|------|------|
| CONTEXT.md | 프로젝트 컨텍스트 | [바로가기](./CONTEXT.md) |
| PRD.md | 제품 요구사항 | [바로가기](./docs/specs/PRD.md) |
| ARCHITECTURE.md | 시스템 아키텍처 | [바로가기](./docs/specs/ARCHITECTURE.md) |
| API_SPEC.md | API 명세 | [바로가기](./docs/specs/API_SPEC.md) |
| CONTRIBUTING.md | 기여 가이드 | [바로가기](./CONTRIBUTING.md) |

---

## 라이선스

**Proprietary Software License** - 이 소프트웨어는 SalonMate의 독점 소유입니다.

무단 복제, 배포, 수정이 금지되며, 상업적 사용을 위해서는 별도의 라이센스 계약이 필요합니다.

자세한 내용은 [LICENSE](./LICENSE) 파일을 참조하세요.

---

## 연락처

- **라이센스 문의**: parkdavid31@gmail.com
- **이슈 리포트**: [GitHub Issues](https://github.com/Prometheus-P/salon-mate/issues)
- **보안 취약점**: parkdavid31@gmail.com

---

*Copyright (c) 2025 SalonMate. All Rights Reserved.*
