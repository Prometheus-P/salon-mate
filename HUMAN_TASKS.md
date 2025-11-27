# 사람이 직접 수행해야 하는 작업 목록

> 이 문서는 코드 자동화가 불가능한, 사람이 직접 수행해야 하는 작업들을 정리합니다.

---

## 1. 외부 서비스 계정 생성 및 API 키 발급 (필수)

### 1.1 Supabase (우선순위: 높음)
- [ ] https://supabase.com 계정 생성
- [ ] 새 프로젝트 생성 (프로젝트명: `salonmate`)
- [ ] Settings > API에서 다음 값 복사:
  - `Project URL` → `.env`의 `NEXT_PUBLIC_SUPABASE_URL`
  - `anon public key` → `.env`의 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role key` → `.env`의 `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Settings > Database에서 Connection string 복사 → `.env`의 `DATABASE_URL`

### 1.2 OpenAI (우선순위: 높음)
- [ ] https://platform.openai.com 계정 생성
- [ ] API Keys 메뉴에서 새 키 생성
- [ ] `.env`의 `OPENAI_API_KEY`에 입력
- [ ] 월 예산 알림 설정 권장 (Usage > Limits)

### 1.3 Google Cloud (우선순위: 중간)
- [ ] https://console.cloud.google.com 프로젝트 생성
- [ ] OAuth 2.0 클라이언트 ID 생성:
  - APIs & Services > Credentials > Create Credentials > OAuth client ID
  - Application type: Web application
  - Authorized redirect URIs 추가:
    - `http://localhost:3000/auth/google/callback` (개발)
    - `https://app.salonmate.kr/auth/google/callback` (프로덕션)
- [ ] `.env`에 입력:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
- [ ] Google My Business API 활성화:
  - APIs & Services > Library > Google My Business API > Enable
- [ ] `.env`의 `GOOGLE_BUSINESS_PROFILE_API_KEY`에 입력

### 1.4 Kakao Developers (우선순위: 중간)
- [ ] https://developers.kakao.com 앱 생성
- [ ] 카카오 로그인 활성화:
  - 앱 설정 > 카카오 로그인 > 활성화 설정 ON
- [ ] Redirect URI 등록:
  - `http://localhost:3000/auth/kakao/callback` (개발)
  - `https://app.salonmate.kr/auth/kakao/callback` (프로덕션)
- [ ] `.env`에 입력:
  - `KAKAO_CLIENT_ID` (REST API 키)
  - `KAKAO_CLIENT_SECRET` (Client Secret)

### 1.5 Meta Developer (우선순위: 중간)
- [ ] https://developers.facebook.com 앱 생성
- [ ] Instagram Graph API 제품 추가
- [ ] 비즈니스 계정 연결
- [ ] `.env`에 입력:
  - `META_APP_ID`
  - `META_APP_SECRET`
  - `INSTAGRAM_CLIENT_ID`
  - `INSTAGRAM_CLIENT_SECRET`

---

## 2. 배포 플랫폼 설정 (프로덕션 준비 시)

### 2.1 Vercel (Frontend 배포)
- [ ] https://vercel.com 계정 생성
- [ ] GitHub 저장소 연결
- [ ] 환경변수 설정 (Settings > Environment Variables)
- [ ] 도메인 연결

### 2.2 Railway (Backend 배포)
- [ ] https://railway.app 계정 생성
- [ ] 새 프로젝트 생성
- [ ] GitHub 저장소 연결
- [ ] 환경변수 설정

### 2.3 Upstash (Redis)
- [ ] https://upstash.com 계정 생성
- [ ] Redis 데이터베이스 생성
- [ ] `.env`의 `REDIS_URL`에 연결 문자열 입력

---

## 3. 도메인 및 DNS 설정

- [ ] 도메인 구매 (예: `salonmate.kr`)
- [ ] Vercel에 커스텀 도메인 연결
- [ ] Railway에 커스텀 도메인 연결 (API 서브도메인)
- [ ] SSL 인증서 확인 (자동 발급)

---

## 4. 모니터링 서비스 설정 (선택)

### 4.1 Sentry
- [ ] https://sentry.io 계정 생성
- [ ] 프로젝트 생성 (Frontend, Backend 각각)
- [ ] `.env`의 `SENTRY_DSN`에 입력

### 4.2 Datadog
- [ ] https://datadoghq.com 계정 생성
- [ ] API 키 발급
- [ ] 에이전트 설치

---

## 5. 결제 시스템 설정 (Phase 4)

### 5.1 Toss Payments
- [ ] https://developers.tosspayments.com 가맹점 등록
- [ ] 테스트 API 키 발급
- [ ] 프로덕션 API 키 발급 (심사 후)
- [ ] 웹훅 URL 등록

---

## 6. 비즈니스/법적 준비 (런칭 전)

- [ ] 사업자 등록
- [ ] 통신판매업 신고
- [ ] 개인정보처리방침 작성 (법률 검토)
- [ ] 이용약관 작성 (법률 검토)
- [ ] 개인정보보호책임자 지정

---

## 7. GitHub 설정

### 7.1 Branch Protection Rules
- [ ] Settings > Branches > Add rule
- [ ] `main` 브랜치:
  - [x] Require pull request reviews before merging
  - [x] Require status checks to pass before merging
  - [x] Include administrators
- [ ] `develop` 브랜치:
  - [x] Require status checks to pass before merging

### 7.2 Repository Secrets
- [ ] Settings > Secrets and variables > Actions
- [ ] 다음 시크릿 등록:
  - `NEXT_PUBLIC_API_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY`
  - (기타 프로덕션 환경변수)

### 7.3 Collaborators
- [ ] 팀원 초대 및 권한 설정

---

## 완료 체크리스트

### 개발 시작 전 (필수)
- [ ] Supabase 설정 완료
- [ ] OpenAI API 키 발급 완료
- [ ] `.env` 파일 생성 및 기본 설정 완료

### 인증 기능 개발 시
- [ ] Google OAuth 설정 완료
- [ ] Kakao OAuth 설정 완료

### MVP 완성 후
- [ ] Vercel 배포 설정 완료
- [ ] Railway 배포 설정 완료
- [ ] 도메인 연결 완료

### 런칭 전
- [ ] 결제 시스템 연동 완료
- [ ] 법적 문서 준비 완료
- [ ] 모니터링 설정 완료

---

*이 문서는 작업 완료 시 체크박스를 업데이트해주세요.*
