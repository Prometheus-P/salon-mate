---
title: SalonMate - TDD 개발 계획
version: 2.0.0
status: In Progress
owner: "@tech-lead"
created: 2025-11-25
updated: 2025-11-25
language: Korean (한국어)
---

# SalonMate TDD 개발 계획

> 이 문서는 TDD 사이클에 따른 개발 진행 상황을 실시간으로 추적합니다.
> **기술 스택**: SvelteKit + Go + Python AI Worker

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 2.0.0 | 2025-11-25 | @tech-lead | SvelteKit + Go + Python Worker 스택으로 변경 |
| 1.0.0 | 2025-11-25 | @tech-lead | 최초 작성 |

---

## 기술 스택 요약

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend    │  SvelteKit 2 + Svelte 5 + Tailwind + Skeleton UI │
│  Backend     │  Go 1.22 + Echo + sqlc + Asynq                   │
│  AI Worker   │  Python 3.12 + LangChain + LangGraph             │
│  Database    │  Neon PostgreSQL (Serverless)                    │
│  Cache/Queue │  Upstash Redis                                   │
│  Storage     │  Cloudflare R2                                   │
│  Hosting     │  Vercel (FE) + Fly.io (API) + Railway (AI)       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 개발 원칙

```
┌─────────┐     ┌─────────┐     ┌───────────┐
│   RED   │ ──▶ │  GREEN  │ ──▶ │ REFACTOR  │
│ (Fail)  │     │ (Pass)  │     │ (Improve) │
└─────────┘     └─────────┘     └───────────┘
     │                               │
     └───────────────────────────────┘
```

**각 기능 개발 시 반드시 준수:**
1. 테스트 먼저 작성 (RED)
2. 테스트 통과하는 최소 코드 작성 (GREEN)
3. 리팩토링 (REFACTOR)
4. 커밋

---

## Phase 1: Foundation (기반 구축)

### Sprint 1: 프로젝트 초기화

| 작업 | 상태 | 테스트 | 담당자 |
|------|------|--------|--------|
| 모노레포 구조 생성 | 🟡 진행중 | N/A | @tech-lead |
| SvelteKit 프로젝트 설정 | ⬜ 대기 | N/A | @frontend |
| Go API 프로젝트 설정 | ⬜ 대기 | N/A | @backend |
| Python AI Worker 설정 | ⬜ 대기 | N/A | @ai-eng |
| Neon PostgreSQL 연결 | ⬜ 대기 | 연결 테스트 | @backend |
| Upstash Redis 연결 | ⬜ 대기 | 연결 테스트 | @backend |
| Docker 개발 환경 구성 | ⬜ 대기 | 컨테이너 실행 테스트 | @devops |
| CI/CD 파이프라인 구축 | ⬜ 대기 | N/A | @devops |

**Sprint 1 체크리스트:**
```
[ ] frontend/ - SvelteKit 프로젝트 생성
[ ] backend/ - Go 모듈 초기화
[ ] ai-worker/ - Python 프로젝트 생성
[ ] infra/docker-compose.yml - 로컬 개발 환경
[ ] .github/workflows/ - CI/CD 설정
```

### Sprint 2: 인증 시스템

| 기능 | 상태 | 테스트 파일 (Go) | 커버리지 |
|------|------|-----------------|----------|
| 이메일 회원가입 | ⬜ 대기 | `auth_test.go` | 0% |
| 이메일 로그인 | ⬜ 대기 | `auth_test.go` | 0% |
| JWT 토큰 발급 | ⬜ 대기 | `jwt_test.go` | 0% |
| 토큰 갱신 | ⬜ 대기 | `jwt_test.go` | 0% |
| Google OAuth | ⬜ 대기 | `oauth_test.go` | 0% |
| Kakao OAuth | ⬜ 대기 | `oauth_test.go` | 0% |
| 로그아웃 | ⬜ 대기 | `auth_test.go` | 0% |

**테스트 시나리오 (Sprint 2 - Go):**

```go
// internal/handler/auth_test.go
func TestUserSignup(t *testing.T) {
    t.Run("should create user when valid email and password", func(t *testing.T) {
        // 유효한 이메일과 비밀번호로 사용자 생성 성공
    })

    t.Run("should return error when email already exists", func(t *testing.T) {
        // 이미 존재하는 이메일로 가입 시 에러 반환
    })

    t.Run("should return error when password too short", func(t *testing.T) {
        // 비밀번호가 8자 미만일 때 에러 반환
    })

    t.Run("should return error when invalid email format", func(t *testing.T) {
        // 이메일 형식이 올바르지 않을 때 에러 반환
    })

    t.Run("should hash password before storing", func(t *testing.T) {
        // 비밀번호는 해시화되어 저장되어야 함
    })
}
```

**SvelteKit 인증 UI 테스트:**

```typescript
// frontend/src/routes/(auth)/login/page.test.ts
describe('Login Page', () => {
    it('should render login form', () => {
        // 로그인 폼 렌더링 확인
    })

    it('should show validation errors', () => {
        // 유효성 검사 에러 표시
    })

    it('should redirect to dashboard on success', () => {
        // 성공 시 대시보드로 리다이렉트
    })
})
```

---

## Phase 2: Core Features (핵심 기능)

### Sprint 3: 리뷰 관리

| 기능 | 상태 | 테스트 파일 | 커버리지 |
|------|------|------------|----------|
| Google 리뷰 조회 | ⬜ 대기 | `review_test.go` | 0% |
| 리뷰 목록 API | ⬜ 대기 | `review_test.go` | 0% |
| 리뷰 상세 API | ⬜ 대기 | `review_test.go` | 0% |
| 리뷰 상태 관리 | ⬜ 대기 | `review_test.go` | 0% |

**테스트 시나리오 (Sprint 3 - Go):**

```go
// internal/handler/review_test.go
func TestGoogleReviewFetch(t *testing.T) {
    t.Run("should fetch reviews from Google Business Profile", func(t *testing.T) {
        // Google Business Profile에서 리뷰 목록 조회 성공
    })

    t.Run("should handle API rate limit gracefully", func(t *testing.T) {
        // API Rate Limit 발생 시 graceful 처리
    })

    t.Run("should store fetched reviews in database", func(t *testing.T) {
        // 조회된 리뷰를 데이터베이스에 저장
    })

    t.Run("should skip already synced reviews", func(t *testing.T) {
        // 이미 동기화된 리뷰는 건너뛰기
    })
}
```

### Sprint 4: AI 리뷰 답변 생성

| 기능 | 상태 | 테스트 파일 (Python) | 커버리지 |
|------|------|---------------------|----------|
| AI 답변 생성 | ⬜ 대기 | `test_review_response.py` | 0% |
| 뷰티 업종 프롬프트 | ⬜ 대기 | `test_prompts.py` | 0% |
| 답변 톤 커스터마이징 | ⬜ 대기 | `test_prompts.py` | 0% |
| 답변 게시 (Google) | ⬜ 대기 | `review_test.go` | 0% |

**테스트 시나리오 (Sprint 4 - Python AI Worker):**

```python
# ai-worker/tests/test_review_response.py
class TestAIReviewResponse:
    """AI 리뷰 답변 생성 테스트"""

    def test_should_generate_response_for_positive_review(self):
        """긍정 리뷰에 대한 감사 답변 생성"""
        pass

    def test_should_generate_empathetic_response_for_negative_review(self):
        """부정 리뷰에 대한 공감 및 개선 약속 답변 생성"""
        pass

    def test_should_include_beauty_specific_terminology(self):
        """뷰티 업종 특화 용어 포함 확인"""
        pass

    def test_should_respect_max_character_limit(self):
        """최대 글자 수 제한 준수"""
        pass

    def test_should_not_include_prohibited_words(self):
        """금지 단어 포함 여부 검증"""
        pass
```

### Sprint 5: 인스타그램 포스팅

| 기능 | 상태 | 테스트 파일 | 커버리지 |
|------|------|------------|----------|
| Instagram 계정 연동 | ⬜ 대기 | `instagram_test.go` | 0% |
| 이미지 업로드 (R2) | ⬜ 대기 | `storage_test.go` | 0% |
| AI 캡션 생성 | ⬜ 대기 | `test_caption.py` | 0% |
| AI 해시태그 추천 | ⬜ 대기 | `test_hashtag.py` | 0% |
| 예약 발행 | ⬜ 대기 | `instagram_test.go` | 0% |
| 즉시 발행 | ⬜ 대기 | `instagram_test.go` | 0% |

**테스트 시나리오 (Sprint 5 - Python AI Worker):**

```python
# ai-worker/tests/test_caption.py
class TestCaptionGeneration:
    """인스타그램 캡션 생성 테스트"""

    def test_should_generate_caption_from_image_description(self):
        """이미지 설명으로부터 캡션 생성"""
        pass

    def test_should_include_call_to_action(self):
        """CTA(Call to Action) 포함 확인"""
        pass

    def test_should_generate_location_based_hashtags(self):
        """지역 기반 해시태그 생성"""
        pass

    def test_should_generate_trending_hashtags(self):
        """트렌드 해시태그 포함"""
        pass

    def test_should_limit_hashtag_count_to_30(self):
        """해시태그 30개 제한 준수"""
        pass
```

---

## Phase 3: UI/UX (사용자 인터페이스)

### Sprint 6: 대시보드

| 기능 | 상태 | 테스트 파일 (Svelte) | 커버리지 |
|------|------|---------------------|----------|
| 대시보드 레이아웃 | ⬜ 대기 | `Dashboard.test.ts` | 0% |
| 리뷰 위젯 | ⬜ 대기 | `ReviewWidget.test.ts` | 0% |
| 포스팅 위젯 | ⬜ 대기 | `PostingWidget.test.ts` | 0% |
| 통계 차트 | ⬜ 대기 | `StatsChart.test.ts` | 0% |

### Sprint 7: 리뷰 관리 UI

| 기능 | 상태 | 테스트 파일 | 커버리지 |
|------|------|------------|----------|
| 리뷰 목록 페이지 | ⬜ 대기 | `ReviewList.test.ts` | 0% |
| 리뷰 상세 모달 | ⬜ 대기 | `ReviewDetail.test.ts` | 0% |
| AI 답변 편집 | ⬜ 대기 | `AIResponseEditor.test.ts` | 0% |
| 답변 발행 버튼 | ⬜ 대기 | `PublishButton.test.ts` | 0% |

### Sprint 8: 인스타 포스팅 UI

| 기능 | 상태 | 테스트 파일 | 커버리지 |
|------|------|------------|----------|
| 이미지 업로더 | ⬜ 대기 | `ImageUploader.test.ts` | 0% |
| 캡션 에디터 | ⬜ 대기 | `CaptionEditor.test.ts` | 0% |
| 해시태그 선택기 | ⬜ 대기 | `HashtagPicker.test.ts` | 0% |
| 예약 시간 선택 | ⬜ 대기 | `SchedulePicker.test.ts` | 0% |
| 포스트 프리뷰 | ⬜ 대기 | `PostPreview.test.ts` | 0% |

---

## Phase 4: Polish & Launch (마무리)

### Sprint 9: 결제 시스템

| 기능 | 상태 | 테스트 파일 | 커버리지 |
|------|------|------------|----------|
| 플랜 선택 페이지 | ⬜ 대기 | `PricingPage.test.ts` | 0% |
| 결제 연동 (토스) | ⬜ 대기 | `payment_test.go` | 0% |
| 구독 관리 | ⬜ 대기 | `subscription_test.go` | 0% |
| 결제 내역 | ⬜ 대기 | `PaymentHistory.test.ts` | 0% |

### Sprint 10: 온보딩 & 설정

| 기능 | 상태 | 테스트 파일 | 커버리지 |
|------|------|------------|----------|
| 온보딩 플로우 | ⬜ 대기 | `Onboarding.test.ts` | 0% |
| 프로필 설정 | ⬜ 대기 | `ProfileSettings.test.ts` | 0% |
| 연동 설정 | ⬜ 대기 | `IntegrationSettings.test.ts` | 0% |
| 알림 설정 | ⬜ 대기 | `NotificationSettings.test.ts` | 0% |

---

## 테스트 커버리지 목표

```
┌─────────────────────────────────────────────────────────────────┐
│                    커버리지 목표                                  │
├─────────────────────────────────────────────────────────────────┤
│  Go Unit Tests          │  ████████████████████  80%+           │
│  Python Unit Tests      │  ████████████████████  80%+           │
│  Svelte Component Tests │  ████████████          60%+           │
│  Integration Tests      │  ████████              40%+           │
│  E2E Tests              │  Critical Path 100%                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 테스트 도구

### Go Backend
```yaml
Testing:
  framework: testing (stdlib)
  assertions: testify
  mocking: mockery
  coverage: go test -cover

Commands:
  test: go test ./...
  coverage: go test -coverprofile=coverage.out ./...
  lint: golangci-lint run
```

### Python AI Worker
```yaml
Testing:
  framework: pytest
  async: pytest-asyncio
  mocking: unittest.mock, responses
  coverage: pytest-cov

Commands:
  test: pytest
  coverage: pytest --cov=src
  lint: ruff check
  type: mypy src
```

### SvelteKit Frontend
```yaml
Testing:
  framework: vitest
  component: @testing-library/svelte
  e2e: playwright
  coverage: vitest --coverage

Commands:
  test: pnpm test
  e2e: pnpm playwright test
  lint: pnpm lint
  check: pnpm check
```

---

## 진행 상황 요약

| Phase | 진행률 | 상태 |
|-------|--------|------|
| Phase 1: Foundation | 0% | 🟡 진행중 |
| Phase 2: Core Features | 0% | ⬜ 대기 |
| Phase 3: UI/UX | 0% | ⬜ 대기 |
| Phase 4: Polish & Launch | 0% | ⬜ 대기 |

**전체 진행률: 5%**

```
[█░░░░░░░░░░░░░░░░░░░] 5%
```

---

## 다음 작업 (Next Up)

### 즉시 실행
1. ✅ 기술 스택 문서 업데이트
2. 🟡 프로젝트 디렉토리 구조 생성
3. ⬜ SvelteKit 프로젝트 초기화
4. ⬜ Go 모듈 초기화
5. ⬜ Python AI Worker 초기화
6. ⬜ Docker Compose 설정
7. ⬜ CI/CD 파이프라인 설정

### 데이터베이스 설정
```bash
# Neon CLI로 프로젝트 생성
neonctl projects create --name salon-mate

# 브랜치 생성 (dev)
neonctl branches create --project-id <project-id> --name dev
```

### 초기 마이그레이션
```sql
-- backend/db/migrations/001_initial.up.sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    source VARCHAR(20) NOT NULL, -- 'google', 'naver'
    external_id VARCHAR(255),
    rating INTEGER,
    content TEXT,
    reviewer_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE review_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_ai_generated BOOLEAN DEFAULT TRUE,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 명령어 참조

### 개발 환경 시작
```bash
# 전체 서비스 시작
docker-compose up -d

# 프론트엔드만
cd frontend && pnpm dev

# 백엔드만
cd backend && go run cmd/api/main.go

# AI Worker만
cd ai-worker && python -m src.main
```

### 테스트 실행
```bash
# Go 테스트
cd backend && go test ./... -v

# Python 테스트
cd ai-worker && pytest -v

# Svelte 테스트
cd frontend && pnpm test
```

### 배포
```bash
# Frontend (자동 - Vercel)
git push origin main

# Backend
fly deploy -c infra/fly.toml

# AI Worker (자동 - Railway)
git push origin main
```

---

*이 문서는 개발 진행에 따라 실시간으로 업데이트됩니다.*
