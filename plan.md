---
title: SalonMate - TDD 개발 계획
version: 1.0.0
status: In Progress
owner: "@tech-lead"
created: 2025-11-25
updated: 2025-11-25
language: Korean (한국어)
---

# SalonMate TDD 개발 계획

> 이 문서는 TDD 사이클에 따른 개발 진행 상황을 실시간으로 추적합니다.

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0.0 | 2025-11-25 | @tech-lead | 최초 작성 |

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
| 프로젝트 구조 생성 | ✅ 완료 | N/A | @tech-lead |
| Next.js 보일러플레이트 설정 | ✅ 완료 | N/A | @frontend |
| FastAPI 보일러플레이트 설정 | ✅ 완료 | N/A | @backend |
| Supabase 연결 설정 | ✅ 완료 | 연결 테스트 | @backend |
| CI/CD 파이프라인 구축 | ⬜ 대기 | N/A | @devops |
| Docker 개발 환경 구성 | ⬜ 대기 | 컨테이너 실행 테스트 | @devops |

### Sprint 2: 인증 시스템

| 기능 | 상태 | 테스트 파일 | 커버리지 |
|------|------|------------|----------|
| 이메일 회원가입 | ⬜ 대기 | `test_auth_signup.py` | 0% |
| 이메일 로그인 | ⬜ 대기 | `test_auth_login.py` | 0% |
| JWT 토큰 발급 | ⬜ 대기 | `test_jwt_token.py` | 0% |
| 토큰 갱신 | ⬜ 대기 | `test_token_refresh.py` | 0% |
| Google OAuth | ⬜ 대기 | `test_oauth_google.py` | 0% |
| Kakao OAuth | ⬜ 대기 | `test_oauth_kakao.py` | 0% |
| 로그아웃 | ⬜ 대기 | `test_auth_logout.py` | 0% |

**테스트 시나리오 (Sprint 2):**

```python
# test_auth_signup.py
class TestUserSignup:
    """사용자 회원가입 테스트"""

    def test_should_create_user_when_valid_email_and_password(self):
        """유효한 이메일과 비밀번호로 사용자 생성 성공"""
        pass

    def test_should_return_error_when_email_already_exists(self):
        """이미 존재하는 이메일로 가입 시 에러 반환"""
        pass

    def test_should_return_error_when_password_too_short(self):
        """비밀번호가 8자 미만일 때 에러 반환"""
        pass

    def test_should_return_error_when_invalid_email_format(self):
        """이메일 형식이 올바르지 않을 때 에러 반환"""
        pass

    def test_should_hash_password_before_storing(self):
        """비밀번호는 해시화되어 저장되어야 함"""
        pass
```

---

## Phase 2: Core Features (핵심 기능)

### Sprint 3: 리뷰 관리

| 기능 | 상태 | 테스트 파일 | 커버리지 |
|------|------|------------|----------|
| Google 리뷰 조회 | ⬜ 대기 | `test_google_review_fetch.py` | 0% |
| 리뷰 목록 API | ⬜ 대기 | `test_review_list.py` | 0% |
| 리뷰 상세 API | ⬜ 대기 | `test_review_detail.py` | 0% |
| 리뷰 상태 관리 | ⬜ 대기 | `test_review_status.py` | 0% |

**테스트 시나리오 (Sprint 3):**

```python
# test_google_review_fetch.py
class TestGoogleReviewFetch:
    """구글 리뷰 조회 테스트"""

    def test_should_fetch_reviews_from_google_business_profile(self):
        """Google Business Profile에서 리뷰 목록 조회 성공"""
        pass

    def test_should_handle_api_rate_limit_gracefully(self):
        """API Rate Limit 발생 시 graceful 처리"""
        pass

    def test_should_store_fetched_reviews_in_database(self):
        """조회된 리뷰를 데이터베이스에 저장"""
        pass

    def test_should_skip_already_synced_reviews(self):
        """이미 동기화된 리뷰는 건너뛰기"""
        pass
```

### Sprint 4: AI 리뷰 답변 생성

| 기능 | 상태 | 테스트 파일 | 커버리지 |
|------|------|------------|----------|
| AI 답변 생성 | ⬜ 대기 | `test_ai_review_response.py` | 0% |
| 뷰티 업종 프롬프트 | ⬜ 대기 | `test_beauty_prompt.py` | 0% |
| 답변 톤 커스터마이징 | ⬜ 대기 | `test_response_tone.py` | 0% |
| 답변 게시 (Google) | ⬜ 대기 | `test_review_reply_post.py` | 0% |

**테스트 시나리오 (Sprint 4):**

```python
# test_ai_review_response.py
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
| Instagram 계정 연동 | ⬜ 대기 | `test_instagram_connect.py` | 0% |
| 이미지 업로드 | ⬜ 대기 | `test_image_upload.py` | 0% |
| AI 캡션 생성 | ⬜ 대기 | `test_caption_generation.py` | 0% |
| AI 해시태그 추천 | ⬜ 대기 | `test_hashtag_recommend.py` | 0% |
| 예약 발행 | ⬜ 대기 | `test_scheduled_post.py` | 0% |
| 즉시 발행 | ⬜ 대기 | `test_instant_post.py` | 0% |

**테스트 시나리오 (Sprint 5):**

```python
# test_caption_generation.py
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

| 기능 | 상태 | 테스트 파일 | 커버리지 |
|------|------|------------|----------|
| 대시보드 레이아웃 | ⬜ 대기 | `Dashboard.test.tsx` | 0% |
| 리뷰 위젯 | ⬜ 대기 | `ReviewWidget.test.tsx` | 0% |
| 포스팅 위젯 | ⬜ 대기 | `PostingWidget.test.tsx` | 0% |
| 통계 차트 | ⬜ 대기 | `StatsChart.test.tsx` | 0% |

### Sprint 7: 리뷰 관리 UI

| 기능 | 상태 | 테스트 파일 | 커버리지 |
|------|------|------------|----------|
| 리뷰 목록 페이지 | ⬜ 대기 | `ReviewList.test.tsx` | 0% |
| 리뷰 상세 모달 | ⬜ 대기 | `ReviewDetail.test.tsx` | 0% |
| AI 답변 편집 | ⬜ 대기 | `AIResponseEditor.test.tsx` | 0% |
| 답변 발행 버튼 | ⬜ 대기 | `PublishButton.test.tsx` | 0% |

### Sprint 8: 인스타 포스팅 UI

| 기능 | 상태 | 테스트 파일 | 커버리지 |
|------|------|------------|----------|
| 이미지 업로더 | ⬜ 대기 | `ImageUploader.test.tsx` | 0% |
| 캡션 에디터 | ⬜ 대기 | `CaptionEditor.test.tsx` | 0% |
| 해시태그 선택기 | ⬜ 대기 | `HashtagPicker.test.tsx` | 0% |
| 예약 시간 선택 | ⬜ 대기 | `SchedulePicker.test.tsx` | 0% |
| 포스트 프리뷰 | ⬜ 대기 | `PostPreview.test.tsx` | 0% |

---

## Phase 4: Polish & Launch (마무리)

### Sprint 9: 결제 시스템

| 기능 | 상태 | 테스트 파일 | 커버리지 |
|------|------|------------|----------|
| 플랜 선택 페이지 | ⬜ 대기 | `PricingPage.test.tsx` | 0% |
| 결제 연동 (토스) | ⬜ 대기 | `test_toss_payment.py` | 0% |
| 구독 관리 | ⬜ 대기 | `test_subscription.py` | 0% |
| 결제 내역 | ⬜ 대기 | `PaymentHistory.test.tsx` | 0% |

### Sprint 10: 온보딩 & 설정

| 기능 | 상태 | 테스트 파일 | 커버리지 |
|------|------|------------|----------|
| 온보딩 플로우 | ⬜ 대기 | `Onboarding.test.tsx` | 0% |
| 프로필 설정 | ⬜ 대기 | `ProfileSettings.test.tsx` | 0% |
| 연동 설정 | ⬜ 대기 | `IntegrationSettings.test.tsx` | 0% |
| 알림 설정 | ⬜ 대기 | `NotificationSettings.test.tsx` | 0% |

---

## 테스트 커버리지 목표

```
┌─────────────────────────────────────────────────────────────┐
│                    커버리지 목표                              │
├─────────────────────────────────────────────────────────────┤
│  Unit Tests        │  ████████████████████  80%+            │
│  Integration Tests │  ████████████          60%+            │
│  E2E Tests         │  Critical Path 100%                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 진행 상황 요약

| Phase | 진행률 | 상태 |
|-------|--------|------|
| Phase 1: Foundation | 67% | 🟡 진행중 |
| Phase 2: Core Features | 0% | ⬜ 대기 |
| Phase 3: UI/UX | 0% | ⬜ 대기 |
| Phase 4: Polish & Launch | 0% | ⬜ 대기 |

**전체 진행률: 20%**

```
[████░░░░░░░░░░░░░░░░] 20%
```

---

## 다음 작업 (Next Up)

1. ✅ Next.js 프로젝트 초기화 <!-- commit: 57ad426, date: 2025-11-26 -->
2. ✅ FastAPI 프로젝트 초기화 <!-- commit: 96efa7a, date: 2025-11-26 -->
3. ✅ Supabase 연결 설정 <!-- date: 2025-11-26, note: Alembic + Redis infrastructure ready -->
4. ⬜ Docker Compose 설정
5. ⬜ CI 파이프라인 설정

---

*이 문서는 개발 진행에 따라 실시간으로 업데이트됩니다.*
