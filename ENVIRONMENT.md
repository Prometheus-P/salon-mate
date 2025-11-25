---
title: SalonMate - 환경 설정 가이드
version: 2.0.0
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
| 2.0.0 | 2025-11-25 | @devops | SvelteKit + Go + Python 스택으로 변경 |
| 1.0.0 | 2025-11-25 | @devops | 최초 작성 |

## 관련 문서

- [README.md](./README.md) - 빠른 시작
- [CONTRIBUTING.md](./CONTRIBUTING.md) - 기여 가이드
- [docker-compose.yml](./infra/docker-compose.yml) - Docker 설정

---

## 1. 시스템 요구사항

### 1.1 필수 소프트웨어

| 소프트웨어 | 버전 | 용도 | 설치 확인 명령 |
|------------|------|------|----------------|
| Node.js | 20.x 이상 | SvelteKit 프론트엔드 | `node --version` |
| pnpm | 9.x 이상 | 패키지 매니저 | `pnpm --version` |
| Go | 1.22 이상 | 백엔드 API | `go version` |
| Python | 3.12 이상 | AI Worker | `python --version` |
| Docker | 24.x 이상 | 컨테이너 | `docker --version` |
| Docker Compose | 2.x 이상 | 오케스트레이션 | `docker compose version` |
| Git | 2.x 이상 | 버전 관리 | `git --version` |

### 1.2 권장 개발 도구

| 도구 | 용도 | 설치 링크 |
|------|------|----------|
| VS Code | IDE | [다운로드](https://code.visualstudio.com/) |
| Cursor | AI 지원 IDE | [다운로드](https://cursor.sh/) |
| TablePlus | DB 관리 | [다운로드](https://tableplus.com/) |
| Postman / Bruno | API 테스트 | [다운로드](https://www.postman.com/) |
| GoLand | Go IDE (선택) | [다운로드](https://www.jetbrains.com/go/) |

### 1.3 VS Code 확장

```json
{
  "recommendations": [
    "svelte.svelte-vscode",
    "bradlc.vscode-tailwindcss",
    "golang.go",
    "ms-python.python",
    "ms-python.vscode-pylance",
    "charliermarsh.ruff",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
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

### 2.2 Go 설치

**macOS (Homebrew):**
```bash
brew install go

# 설치 확인
go version  # go1.22.x
```

**Windows:**
```powershell
winget install GoLang.Go
```

**Linux (Ubuntu/Debian):**
```bash
# 공식 tarball 다운로드 및 설치
wget https://go.dev/dl/go1.22.0.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.22.0.linux-amd64.tar.gz

# PATH 추가 (~/.bashrc 또는 ~/.zshrc)
export PATH=$PATH:/usr/local/go/bin
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin

# 설치 확인
go version
```

### 2.3 Python 설치

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

### 2.4 Docker 설치

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
APP_ENV=development
FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:8080

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Neon PostgreSQL (https://neon.tech 에서 프로젝트 생성)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATABASE_URL=postgresql://user:password@localhost:5432/salonmate?sslmode=disable
# 프로덕션: postgresql://user:password@ep-xxx.region.aws.neon.tech/salonmate?sslmode=require

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Upstash Redis (https://upstash.com 에서 생성)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REDIS_URL=redis://localhost:6379
# 프로덕션: rediss://default:xxx@xxx.upstash.io:6379

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Cloudflare R2 (https://dash.cloudflare.com 에서 생성)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=salonmate-storage
R2_PUBLIC_URL=https://pub-xxx.r2.dev

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# OpenAI (https://platform.openai.com 에서 API 키 발급)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OPENAI_API_KEY=sk-your-openai-api-key

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Google APIs (Google Cloud Console에서 발급)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Meta/Instagram (Meta Developer Console에서 발급)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Kakao (Kakao Developers에서 발급)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# JWT 설정
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=168h

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 모니터링 (선택)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SENTRY_DSN=your_sentry_dsn
```

### 3.3 Frontend 설정 (SvelteKit)

```bash
cd frontend

# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev
```

**브라우저에서 확인:** http://localhost:5173

### 3.4 Backend 설정 (Go)

```bash
cd backend

# 의존성 다운로드
go mod download

# sqlc 설치 (SQL 코드 생성)
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest

# golang-migrate 설치 (마이그레이션)
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

# SQL 코드 생성
sqlc generate

# 개발 서버 실행
go run cmd/api/main.go
```

**API 확인:** http://localhost:8080/health

### 3.5 AI Worker 설정 (Python)

```bash
cd ai-worker

# 가상 환경 생성
python -m venv venv

# 가상 환경 활성화
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# Worker 실행
python -m src.main
```

---

## 4. Docker 개발 환경

### 4.1 전체 스택 실행

```bash
# 모든 서비스 빌드 및 실행
docker compose -f infra/docker-compose.yml up -d

# 로그 확인
docker compose -f infra/docker-compose.yml logs -f

# 특정 서비스 로그 확인
docker compose -f infra/docker-compose.yml logs -f api
docker compose -f infra/docker-compose.yml logs -f frontend
```

### 4.2 개별 서비스 실행

```bash
# 데이터베이스 및 캐시만 실행 (로컬 개발 시)
docker compose -f infra/docker-compose.yml up -d postgres redis

# 프론트엔드는 로컬에서, 나머지는 Docker
cd frontend && pnpm dev
```

### 4.3 서비스 중지 및 정리

```bash
# 서비스 중지
docker compose -f infra/docker-compose.yml down

# 볼륨 포함 정리 (데이터 삭제)
docker compose -f infra/docker-compose.yml down -v

# 이미지까지 정리
docker compose -f infra/docker-compose.yml down --rmi all
```

---

## 5. 데이터베이스 설정

### 5.1 로컬 PostgreSQL (Docker)

```bash
# PostgreSQL 컨테이너만 실행
docker compose -f infra/docker-compose.yml up -d postgres

# 연결 테스트
psql postgresql://postgres:password@localhost:5432/salonmate
```

### 5.2 Neon PostgreSQL 설정 (프로덕션)

1. [Neon](https://neon.tech) 계정 생성
2. 새 프로젝트 생성
3. Connection Details에서 Connection string 복사
4. `.env`의 `DATABASE_URL`에 입력

**Neon 특징:**
- 서버리스 자동 스케일링
- 브랜칭 (dev/staging/prod 분리)
- 내장 Connection Pooling

### 5.3 마이그레이션

```bash
cd backend

# 새 마이그레이션 생성
migrate create -ext sql -dir db/migrations -seq create_users_table

# 마이그레이션 실행 (up)
migrate -database "$DATABASE_URL" -path db/migrations up

# 마이그레이션 롤백 (down)
migrate -database "$DATABASE_URL" -path db/migrations down 1

# 특정 버전으로 이동
migrate -database "$DATABASE_URL" -path db/migrations goto 3
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
3. Redirect URI 등록: `http://localhost:5173/auth/kakao/callback`
4. `.env`에 REST API 키 입력

### 6.5 Upstash Redis

1. [Upstash Console](https://console.upstash.com) 계정 생성
2. 새 Redis 데이터베이스 생성
3. REST API URL 및 Token 복사
4. `.env`의 `REDIS_URL`에 입력

### 6.6 Cloudflare R2

1. [Cloudflare Dashboard](https://dash.cloudflare.com) 계정 생성
2. R2 활성화 및 버킷 생성
3. API 토큰 생성 (R2 읽기/쓰기 권한)
4. `.env`에 관련 값 입력

---

## 7. 환경별 설정

### 7.1 환경 구분

| 환경 | 용도 | 브랜치 | 호스팅 |
|------|------|--------|--------|
| `development` | 로컬 개발 | feature/* | localhost |
| `staging` | 테스트/QA | develop | Vercel Preview |
| `production` | 운영 서비스 | main | Vercel + Fly.io |

### 7.2 환경별 환경 변수

```bash
# 환경별 .env 파일
.env                   # 공통 (gitignore)
.env.development       # 로컬 개발
.env.staging           # 스테이징
.env.production        # 프로덕션 (gitignore)
```

### 7.3 배포 플랫폼별 설정

**Vercel (Frontend):**
- Project Settings > Environment Variables에서 설정
- `PUBLIC_` 접두사 변수는 클라이언트에 노출

**Fly.io (Backend):**
```bash
# 시크릿 설정
fly secrets set DATABASE_URL="your_neon_url"
fly secrets set REDIS_URL="your_upstash_url"
fly secrets set JWT_SECRET="your_jwt_secret"
```

**Railway (AI Worker):**
- Dashboard > Variables에서 설정
- 자동으로 컨테이너에 주입

---

## 8. 문제 해결

### 8.1 일반적인 문제

**Port 충돌:**
```bash
# 사용 중인 포트 확인
lsof -i :5173  # Frontend
lsof -i :8080  # Backend
lsof -i :5432  # PostgreSQL

# 프로세스 종료
kill -9 <PID>
```

**Node 모듈 문제:**
```bash
# node_modules 완전 삭제 후 재설치
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Go 모듈 문제:**
```bash
# 모듈 캐시 정리
go clean -modcache
go mod download
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
docker compose -f infra/docker-compose.yml build --no-cache
docker compose -f infra/docker-compose.yml up -d
```

**볼륨 초기화:**
```bash
docker compose -f infra/docker-compose.yml down -v
docker compose -f infra/docker-compose.yml up -d
```

### 8.3 데이터베이스 연결 문제

**Go에서 연결 테스트:**
```go
// 간단한 테스트 코드
db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
if err != nil {
    log.Fatal(err)
}
if err := db.Ping(); err != nil {
    log.Fatal(err)
}
fmt.Println("Connected!")
```

**psql로 직접 연결:**
```bash
psql "$DATABASE_URL"
```

---

## 9. 보안 주의사항

### 9.1 절대 커밋하면 안 되는 파일

```gitignore
# 환경 변수
.env
.env.local
.env.*.local
.env.production

# 인증서/키
*.pem
*.key
*.crt

# Go 바이너리
/backend/bin/
```

### 9.2 시크릿 관리 원칙

1. **API 키는 환경 변수로만 관리**
2. **프로덕션 시크릿은 Fly.io Secrets / Vercel Env 사용**
3. **로컬 개발용 키와 프로덕션 키 분리**
4. **키 노출 시 즉시 재발급**

---

## 10. 체크리스트

### 10.1 설치 완료 체크리스트

- [ ] Node.js 20.x 설치됨
- [ ] pnpm 9.x 설치됨
- [ ] Go 1.22 설치됨
- [ ] Python 3.12 설치됨
- [ ] Docker & Docker Compose 설치됨
- [ ] VS Code + 확장 설치됨

### 10.2 프로젝트 설정 체크리스트

- [ ] 저장소 클론됨
- [ ] .env 파일 생성 및 설정됨
- [ ] Frontend 의존성 설치됨 (`pnpm install`)
- [ ] Backend 의존성 설치됨 (`go mod download`)
- [ ] AI Worker 의존성 설치됨 (`pip install`)
- [ ] Docker Compose로 서비스 실행 가능

### 10.3 외부 API 체크리스트

- [ ] Neon PostgreSQL 프로젝트 생성됨
- [ ] Upstash Redis 생성됨
- [ ] OpenAI API 키 발급됨
- [ ] Cloudflare R2 버킷 생성됨 (선택)
- [ ] Google Cloud 프로젝트 생성됨 (선택)
- [ ] Meta Developer 앱 생성됨 (선택)
- [ ] Kakao Developer 앱 생성됨 (선택)

---

*문제가 발생하면 [Issues](https://github.com/your-org/salon-mate/issues)에 등록해주세요.*
