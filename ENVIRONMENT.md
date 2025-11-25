---
title: SalonMate - 환경 설정 가이드
version: 1.0.0
status: Approved
owner: "@devops"
created: 2025-11-25
updated: 2025-11-25
language: Korean (한국어)
---

# 환경 설정 가이드

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0.0 | 2025-11-25 | @devops | 최초 작성 |

## 관련 문서

- [README.md](./README.md) - 빠른 시작
- [CONTRIBUTING.md](./CONTRIBUTING.md) - 기여 가이드
- [docker-compose.yml](./docker-compose.yml) - Docker 설정

---

## 1. 시스템 요구사항

### 1.1 필수 소프트웨어

| 소프트웨어 | 버전 | 설치 확인 명령 |
|------------|------|----------------|
| Node.js | 20.x 이상 | `node --version` |
| pnpm | 9.x 이상 | `pnpm --version` |
| Python | 3.12 이상 | `python --version` |
| Docker | 24.x 이상 | `docker --version` |
| Docker Compose | 2.x 이상 | `docker compose version` |
| Git | 2.x 이상 | `git --version` |

### 1.2 권장 개발 도구

| 도구 | 용도 | 설치 링크 |
|------|------|----------|
| VS Code | IDE | [다운로드](https://code.visualstudio.com/) |
| Cursor | AI 지원 IDE | [다운로드](https://cursor.sh/) |
| TablePlus | DB 관리 | [다운로드](https://tableplus.com/) |
| Postman | API 테스트 | [다운로드](https://www.postman.com/) |

### 1.3 VS Code 확장

```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.vscode-pylance",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-azuretools.vscode-docker",
    "github.copilot"
  ]
}
```

---

## 2. 설치 가이드

### 2.1 Node.js & pnpm 설치

**macOS (Homebrew):**
```bash
# Node.js 설치
brew install node@20

# pnpm 설치
npm install -g pnpm@latest

# 설치 확인
node --version   # v20.x.x
pnpm --version   # 9.x.x
```

**Windows (winget):**
```powershell
# Node.js 설치
winget install OpenJS.NodeJS.LTS

# pnpm 설치
npm install -g pnpm@latest
```

**Linux (Ubuntu/Debian):**
```bash
# Node.js 설치 (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm 설치
npm install -g pnpm@latest
```

### 2.2 Python 설치

**macOS (Homebrew):**
```bash
brew install python@3.12

# 설치 확인
python3 --version  # Python 3.12.x
```

**Windows:**
```powershell
winget install Python.Python.3.12
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install python3.12 python3.12-venv python3-pip
```

### 2.3 Docker 설치

**macOS:**
```bash
# Docker Desktop 설치
brew install --cask docker

# 설치 후 Docker Desktop 앱 실행 필요
```

**Windows:**
- [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) 다운로드 및 설치
- WSL2 백엔드 사용 권장

**Linux (Ubuntu):**
```bash
# Docker 설치
curl -fsSL https://get.docker.com | sh

# 현재 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER

# 재로그인 후 확인
docker --version
```

---

## 3. 프로젝트 설정

### 3.1 저장소 클론

```bash
git clone https://github.com/your-org/salon-mate.git
cd salon-mate
```

### 3.2 환경 변수 설정

```bash
# 환경 변수 템플릿 복사
cp .env.example .env
```

**.env 파일 편집:**

```bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 애플리케이션 설정
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_URL=http://localhost:8000

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Supabase (https://supabase.com 에서 프로젝트 생성)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres:password@localhost:5432/salonmate

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# OpenAI (https://platform.openai.com 에서 API 키 발급)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OPENAI_API_KEY=sk-your-openai-api-key

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Google APIs (Google Cloud Console에서 발급)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_BUSINESS_PROFILE_API_KEY=your_gbp_api_key

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Meta/Instagram (Meta Developer Console에서 발급)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Kakao (Kakao Developers에서 발급)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Redis (로컬 Docker 또는 Upstash)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REDIS_URL=redis://localhost:6379

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# JWT 설정
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JWT_SECRET_KEY=your-super-secret-jwt-key-min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 모니터링 (선택)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SENTRY_DSN=your_sentry_dsn
```

### 3.3 Frontend 설정

```bash
cd src/frontend

# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev
```

**브라우저에서 확인:** http://localhost:3000

### 3.4 Backend 설정

```bash
cd src/backend

# 가상 환경 생성
python -m venv venv

# 가상 환경 활성화
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 개발 서버 실행
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**API 문서 확인:** http://localhost:8000/docs

---

## 4. Docker 개발 환경

### 4.1 전체 스택 실행

```bash
# 모든 서비스 빌드 및 실행
docker compose up -d

# 로그 확인
docker compose logs -f

# 특정 서비스 로그 확인
docker compose logs -f backend
docker compose logs -f frontend
```

### 4.2 개별 서비스 실행

```bash
# 데이터베이스 및 캐시만 실행
docker compose up -d postgres redis

# 백엔드만 실행
docker compose up -d backend

# 프론트엔드만 실행
docker compose up -d frontend
```

### 4.3 서비스 중지 및 정리

```bash
# 서비스 중지
docker compose down

# 볼륨 포함 정리 (데이터 삭제)
docker compose down -v

# 이미지까지 정리
docker compose down --rmi all
```

---

## 5. 데이터베이스 설정

### 5.1 로컬 PostgreSQL (Docker)

```bash
# PostgreSQL 컨테이너만 실행
docker compose up -d postgres

# 연결 테스트
psql postgresql://postgres:password@localhost:5432/salonmate
```

### 5.2 Supabase 설정

1. [Supabase](https://supabase.com) 계정 생성
2. 새 프로젝트 생성
3. Settings > API에서 다음 값 복사:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`
4. Settings > Database에서 Connection string 복사 → `DATABASE_URL`

### 5.3 마이그레이션

```bash
cd src/backend

# 마이그레이션 생성
alembic revision --autogenerate -m "description"

# 마이그레이션 실행
alembic upgrade head

# 마이그레이션 롤백
alembic downgrade -1
```

---

## 6. 외부 API 설정

### 6.1 OpenAI API

1. [OpenAI Platform](https://platform.openai.com) 계정 생성
2. API Keys 메뉴에서 새 키 생성
3. `.env`의 `OPENAI_API_KEY`에 입력

**사용량 모니터링:**
- [Usage Dashboard](https://platform.openai.com/usage)에서 확인
- 월 예산 알림 설정 권장

### 6.2 Google Business Profile API

1. [Google Cloud Console](https://console.cloud.google.com) 프로젝트 생성
2. Google My Business API 활성화
3. OAuth 2.0 클라이언트 ID 생성
4. `.env`에 클라이언트 ID/Secret 입력

### 6.3 Instagram Graph API

1. [Meta Developer Portal](https://developers.facebook.com) 앱 생성
2. Instagram Graph API 제품 추가
3. 비즈니스 계정 연결
4. `.env`에 앱 ID/Secret 입력

### 6.4 Kakao OAuth

1. [Kakao Developers](https://developers.kakao.com) 앱 생성
2. 카카오 로그인 활성화
3. Redirect URI 등록: `http://localhost:3000/auth/kakao/callback`
4. `.env`에 REST API 키 입력

---

## 7. 환경별 설정

### 7.1 환경 구분

| 환경 | 용도 | 브랜치 |
|------|------|--------|
| `development` | 로컬 개발 | feature/* |
| `staging` | 테스트/QA | develop |
| `production` | 운영 서비스 | main |

### 7.2 환경별 환경 변수

```bash
# 환경별 .env 파일
.env.development   # 로컬 개발
.env.staging       # 스테이징
.env.production    # 프로덕션
```

### 7.3 환경 변수 로드 우선순위

```
1. 시스템 환경 변수
2. .env.{NODE_ENV}.local
3. .env.{NODE_ENV}
4. .env.local
5. .env
```

---

## 8. 문제 해결

### 8.1 일반적인 문제

**Port 충돌:**
```bash
# 사용 중인 포트 확인
lsof -i :3000
lsof -i :8000

# 프로세스 종료
kill -9 <PID>
```

**Node 모듈 문제:**
```bash
# node_modules 완전 삭제 후 재설치
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Python 가상 환경 문제:**
```bash
# 가상 환경 재생성
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 8.2 Docker 문제

**컨테이너 재빌드:**
```bash
docker compose build --no-cache
docker compose up -d
```

**볼륨 초기화:**
```bash
docker compose down -v
docker compose up -d
```

**로그 확인:**
```bash
docker compose logs -f <service_name>
```

### 8.3 데이터베이스 연결 문제

**연결 테스트:**
```bash
# PostgreSQL 연결 테스트
psql $DATABASE_URL -c "SELECT 1"

# Python에서 테스트
python -c "from sqlalchemy import create_engine; e = create_engine('$DATABASE_URL'); e.connect()"
```

---

## 9. 보안 주의사항

### 9.1 절대 커밋하면 안 되는 파일

```gitignore
# 환경 변수
.env
.env.local
.env.*.local

# 인증서/키
*.pem
*.key
*.crt

# 개인 설정
.env.development.local
.env.staging.local
.env.production.local
```

### 9.2 시크릿 관리 원칙

1. **API 키는 환경 변수로만 관리**
2. **프로덕션 시크릿은 Vault/Secrets Manager 사용**
3. **로컬 개발용 키와 프로덕션 키 분리**
4. **키 노출 시 즉시 재발급**

---

## 10. 체크리스트

### 10.1 설치 완료 체크리스트

- [ ] Node.js 20.x 설치됨
- [ ] pnpm 9.x 설치됨
- [ ] Python 3.12 설치됨
- [ ] Docker & Docker Compose 설치됨
- [ ] VS Code + 확장 설치됨

### 10.2 프로젝트 설정 체크리스트

- [ ] 저장소 클론됨
- [ ] .env 파일 생성 및 설정됨
- [ ] Frontend 의존성 설치됨
- [ ] Backend 의존성 설치됨
- [ ] Docker Compose로 서비스 실행 가능

### 10.3 외부 API 체크리스트

- [ ] OpenAI API 키 발급됨
- [ ] Supabase 프로젝트 생성됨
- [ ] Google Cloud 프로젝트 생성됨 (선택)
- [ ] Meta Developer 앱 생성됨 (선택)
- [ ] Kakao Developer 앱 생성됨 (선택)

---

*문제가 발생하면 [Issues](https://github.com/your-org/salon-mate/issues)에 등록해주세요.*
