---
title: SalonMate - API 명세
version: 1.0.0
status: Approved
owner: "@backend-lead"
created: 2025-11-25
updated: 2025-11-25
reviewers: ["@tech-lead", "@frontend-lead"]
language: Korean (한국어)
---

# API 명세 (API Specification)

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0.0 | 2025-11-25 | @backend-lead | 최초 작성 |

## 관련 문서

- [ARCHITECTURE.md](./ARCHITECTURE.md) - 시스템 아키텍처
- [DATA_MODEL.md](./DATA_MODEL.md) - 데이터 모델
- [docs/guides/ERROR_HANDLING_GUIDE.md](../guides/ERROR_HANDLING_GUIDE.md) - 에러 처리 가이드

---

## 1. API 개요

### 1.1 Base URL

| 환경 | URL |
|------|-----|
| Production | `https://api.salonmate.kr` |
| Staging | `https://api-staging.salonmate.kr` |
| Development | `http://localhost:8000` |

### 1.2 버전 관리

```
https://api.salonmate.kr/v1/...
```

### 1.3 인증

모든 인증이 필요한 API는 `Authorization` 헤더에 Bearer 토큰을 포함해야 합니다.

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 1.4 공통 응답 형식

**성공 응답:**
```json
{
  "data": { ... },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2025-11-25T10:30:00Z"
  }
}
```

**페이지네이션 응답:**
```json
{
  "data": [ ... ],
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2025-11-25T10:30:00Z"
  },
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**에러 응답:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "사용자 친화적 에러 메시지",
    "details": { ... }
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2025-11-25T10:30:00Z"
  }
}
```

---

## 2. 인증 API

### POST /v1/auth/signup

**설명:** 이메일 회원가입

**인증:** 불필요

**요청:**
```json
{
  "email": "string (required, email format)",
  "password": "string (required, min 8 chars)",
  "name": "string (required, min 2 chars)",
  "shopName": "string (optional)",
  "shopType": "string (optional, enum: nail|hair|skin|lash)"
}
```

**응답 (201):**
```json
{
  "data": {
    "user": {
      "id": "user_abc123",
      "email": "owner@example.com",
      "name": "김미영",
      "createdAt": "2025-11-25T10:00:00Z"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 1800
  }
}
```

**에러 응답:**
| Status | Code | Message |
|--------|------|---------|
| 400 | INVALID_EMAIL_FORMAT | 이메일 형식이 올바르지 않습니다 |
| 400 | PASSWORD_TOO_SHORT | 비밀번호는 8자 이상이어야 합니다 |
| 409 | EMAIL_ALREADY_EXISTS | 이미 등록된 이메일입니다 |

---

### POST /v1/auth/login

**설명:** 이메일 로그인

**인증:** 불필요

**요청:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**응답 (200):**
```json
{
  "data": {
    "user": {
      "id": "user_abc123",
      "email": "owner@example.com",
      "name": "김미영"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 1800
  }
}
```

**에러 응답:**
| Status | Code | Message |
|--------|------|---------|
| 401 | INVALID_CREDENTIALS | 이메일 또는 비밀번호가 올바르지 않습니다 |
| 429 | TOO_MANY_ATTEMPTS | 로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요 |

---

### POST /v1/auth/refresh

**설명:** 토큰 갱신

**인증:** 불필요 (Refresh Token 사용)

**요청:**
```json
{
  "refreshToken": "string (required)"
}
```

**응답 (200):**
```json
{
  "data": {
    "accessToken": "eyJhbGc...",
    "expiresIn": 1800
  }
}
```

**에러 응답:**
| Status | Code | Message |
|--------|------|---------|
| 401 | INVALID_REFRESH_TOKEN | 유효하지 않은 리프레시 토큰입니다 |
| 401 | REFRESH_TOKEN_EXPIRED | 리프레시 토큰이 만료되었습니다 |

---

### POST /v1/auth/oauth/google

**설명:** Google OAuth 로그인

**인증:** 불필요

**요청:**
```json
{
  "code": "string (required, OAuth authorization code)",
  "redirectUri": "string (required)"
}
```

**응답 (200):**
```json
{
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": 1800,
    "isNewUser": true
  }
}
```

---

### POST /v1/auth/oauth/kakao

**설명:** Kakao OAuth 로그인

**인증:** 불필요

**요청:**
```json
{
  "code": "string (required, OAuth authorization code)",
  "redirectUri": "string (required)"
}
```

**응답 (200):** Google OAuth와 동일

---

### POST /v1/auth/logout

**설명:** 로그아웃

**인증:** 필요

**응답 (200):**
```json
{
  "data": {
    "message": "로그아웃되었습니다"
  }
}
```

---

## 3. 사용자 API

### GET /v1/users/me

**설명:** 현재 사용자 정보 조회

**인증:** 필요

**응답 (200):**
```json
{
  "data": {
    "id": "user_abc123",
    "email": "owner@example.com",
    "name": "김미영",
    "shop": {
      "id": "shop_xyz789",
      "name": "미영네일",
      "type": "nail",
      "address": "서울시 강남구..."
    },
    "subscription": {
      "plan": "pro",
      "status": "active",
      "expiresAt": "2026-01-25T00:00:00Z"
    },
    "integrations": {
      "google": true,
      "instagram": false
    },
    "createdAt": "2025-11-25T10:00:00Z"
  }
}
```

---

### PATCH /v1/users/me

**설명:** 사용자 정보 수정

**인증:** 필요

**요청:**
```json
{
  "name": "string (optional)",
  "shopName": "string (optional)",
  "shopType": "string (optional)",
  "shopAddress": "string (optional)"
}
```

**응답 (200):** 수정된 사용자 정보

---

## 4. 리뷰 API

### GET /v1/reviews

**설명:** 리뷰 목록 조회

**인증:** 필요

**쿼리 파라미터:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| page | integer | N | 페이지 번호 (기본: 1) |
| pageSize | integer | N | 페이지 크기 (기본: 20, 최대: 100) |
| source | string | N | 플랫폼 필터 (google, naver) |
| status | string | N | 상태 필터 (pending, replied, skipped) |
| rating | integer | N | 별점 필터 (1-5) |
| startDate | string | N | 시작 날짜 (ISO 8601) |
| endDate | string | N | 종료 날짜 (ISO 8601) |

**응답 (200):**
```json
{
  "data": [
    {
      "id": "rv_abc123",
      "source": "google",
      "authorName": "김**",
      "rating": 5,
      "content": "네일 너무 예뻐요! 디자이너님 손재주가 정말 좋으세요~",
      "status": "pending",
      "aiResponse": {
        "content": "김** 고객님, 따뜻한 리뷰 감사드립니다...",
        "generatedAt": "2025-11-25T10:05:00Z"
      },
      "publishedResponse": null,
      "createdAt": "2025-11-25T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 45,
    "totalPages": 3
  }
}
```

---

### GET /v1/reviews/{reviewId}

**설명:** 리뷰 상세 조회

**인증:** 필요

**응답 (200):**
```json
{
  "data": {
    "id": "rv_abc123",
    "source": "google",
    "sourceReviewId": "ChIJ...",
    "authorName": "김**",
    "authorProfileUrl": "https://...",
    "rating": 5,
    "content": "네일 너무 예뻐요! 디자이너님 손재주가 정말 좋으세요~",
    "status": "pending",
    "aiResponse": {
      "content": "김** 고객님, 따뜻한 리뷰 감사드립니다...",
      "generatedAt": "2025-11-25T10:05:00Z",
      "modelVersion": "gpt-4o"
    },
    "publishedResponse": null,
    "createdAt": "2025-11-25T10:00:00Z",
    "updatedAt": "2025-11-25T10:05:00Z"
  }
}
```

**에러 응답:**
| Status | Code | Message |
|--------|------|---------|
| 404 | REVIEW_NOT_FOUND | 리뷰를 찾을 수 없습니다 |

---

### POST /v1/reviews/{reviewId}/generate-response

**설명:** AI 답변 재생성

**인증:** 필요

**요청:**
```json
{
  "tone": "string (optional, enum: friendly|professional|casual, default: friendly)",
  "customInstructions": "string (optional, max 200 chars)"
}
```

**응답 (200):**
```json
{
  "data": {
    "aiResponse": {
      "content": "새로 생성된 AI 답변...",
      "generatedAt": "2025-11-25T11:00:00Z"
    }
  }
}
```

---

### POST /v1/reviews/{reviewId}/publish

**설명:** 리뷰 답변 게시 (Google)

**인증:** 필요

**요청:**
```json
{
  "content": "string (required, 게시할 답변 내용)"
}
```

**응답 (200):**
```json
{
  "data": {
    "id": "rv_abc123",
    "status": "replied",
    "publishedResponse": {
      "content": "게시된 답변 내용...",
      "publishedAt": "2025-11-25T11:05:00Z"
    }
  }
}
```

**에러 응답:**
| Status | Code | Message |
|--------|------|---------|
| 400 | RESPONSE_TOO_SHORT | 답변이 너무 짧습니다 (최소 20자) |
| 400 | RESPONSE_TOO_LONG | 답변이 너무 깁니다 (최대 500자) |
| 409 | ALREADY_REPLIED | 이미 답변이 게시된 리뷰입니다 |
| 502 | GOOGLE_API_ERROR | Google API 오류가 발생했습니다 |

---

### PATCH /v1/reviews/{reviewId}/skip

**설명:** 리뷰 건너뛰기

**인증:** 필요

**응답 (200):**
```json
{
  "data": {
    "id": "rv_abc123",
    "status": "skipped"
  }
}
```

---

## 5. 인스타그램 API

### POST /v1/instagram/content/generate

**설명:** 캡션 및 해시태그 생성

**인증:** 필요

**요청:**
```json
{
  "serviceType": "string (required, enum: nail|hair|skin|lash)",
  "serviceName": "string (required, 시술명)",
  "colors": ["string"],
  "features": ["string"],
  "mood": "string (optional, enum: luxurious|cute|natural|trendy)",
  "location": "string (optional, 지역명)"
}
```

**응답 (200):**
```json
{
  "data": {
    "caption": {
      "content": "✨ 크리스마스 글리터 네일 ✨\n\n핑크와 골드의 조합으로...",
      "characterCount": 256
    },
    "hashtags": {
      "items": [
        { "tag": "#강남네일", "category": "location" },
        { "tag": "#글리터네일", "category": "service" },
        { "tag": "#크리스마스네일", "category": "trend" }
      ],
      "count": 20,
      "formatted": "#강남네일 #글리터네일 #크리스마스네일 ..."
    }
  }
}
```

---

### POST /v1/instagram/posts

**설명:** 인스타그램 포스트 생성 (발행 예약)

**인증:** 필요

**요청:**
```json
{
  "imageUrls": ["string (required, max 10)"],
  "caption": "string (required)",
  "hashtags": ["string"],
  "scheduledAt": "string (optional, ISO 8601, 예약 발행 시간)"
}
```

**응답 (201):**
```json
{
  "data": {
    "id": "post_xyz789",
    "status": "scheduled",
    "imageUrls": ["https://storage.salonmate.kr/..."],
    "caption": "...",
    "hashtags": ["..."],
    "scheduledAt": "2025-11-26T09:00:00Z",
    "createdAt": "2025-11-25T11:00:00Z"
  }
}
```

---

### GET /v1/instagram/posts

**설명:** 포스트 목록 조회

**인증:** 필요

**쿼리 파라미터:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| status | string | N | 상태 (draft, scheduled, published, failed) |
| page | integer | N | 페이지 번호 |
| pageSize | integer | N | 페이지 크기 |

**응답 (200):**
```json
{
  "data": [
    {
      "id": "post_xyz789",
      "status": "published",
      "imageUrls": ["..."],
      "caption": "...",
      "instagramPostId": "17895...",
      "instagramPermalink": "https://instagram.com/p/...",
      "publishedAt": "2025-11-26T09:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

### DELETE /v1/instagram/posts/{postId}

**설명:** 예약된 포스트 취소

**인증:** 필요

**응답 (200):**
```json
{
  "data": {
    "message": "포스트가 취소되었습니다"
  }
}
```

**에러 응답:**
| Status | Code | Message |
|--------|------|---------|
| 400 | POST_ALREADY_PUBLISHED | 이미 발행된 포스트는 취소할 수 없습니다 |

---

## 6. 통합 API

### POST /v1/integrations/google/connect

**설명:** Google Business Profile 연동

**인증:** 필요

**요청:**
```json
{
  "code": "string (required, OAuth authorization code)",
  "redirectUri": "string (required)"
}
```

**응답 (200):**
```json
{
  "data": {
    "connected": true,
    "accountId": "accounts/123456",
    "locationName": "미영네일 - 강남점",
    "connectedAt": "2025-11-25T12:00:00Z"
  }
}
```

---

### DELETE /v1/integrations/google/disconnect

**설명:** Google Business Profile 연동 해제

**인증:** 필요

**응답 (200):**
```json
{
  "data": {
    "disconnected": true
  }
}
```

---

### POST /v1/integrations/instagram/connect

**설명:** Instagram 비즈니스 계정 연동

**인증:** 필요

**요청:**
```json
{
  "code": "string (required)",
  "redirectUri": "string (required)"
}
```

**응답 (200):**
```json
{
  "data": {
    "connected": true,
    "instagramAccountId": "17841...",
    "username": "@miyoung_nail",
    "connectedAt": "2025-11-25T12:00:00Z"
  }
}
```

---

## 7. 파일 업로드 API

### POST /v1/uploads/images

**설명:** 이미지 업로드

**인증:** 필요

**Content-Type:** `multipart/form-data`

**요청:**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| file | file | Y | 이미지 파일 (jpg, png, webp) |
| purpose | string | Y | 용도 (instagram, profile) |

**제한:**
- 최대 파일 크기: 10MB
- 허용 형식: jpg, jpeg, png, webp
- 최대 해상도: 4096x4096

**응답 (201):**
```json
{
  "data": {
    "id": "img_abc123",
    "url": "https://storage.salonmate.kr/uploads/img_abc123.jpg",
    "thumbnailUrl": "https://storage.salonmate.kr/uploads/img_abc123_thumb.jpg",
    "width": 1080,
    "height": 1080,
    "size": 524288,
    "mimeType": "image/jpeg"
  }
}
```

**에러 응답:**
| Status | Code | Message |
|--------|------|---------|
| 400 | FILE_TOO_LARGE | 파일 크기가 10MB를 초과합니다 |
| 400 | INVALID_FILE_TYPE | 지원하지 않는 파일 형식입니다 |
| 413 | PAYLOAD_TOO_LARGE | 요청 크기가 너무 큽니다 |

---

## 8. 대시보드 API

### GET /v1/dashboard/stats

**설명:** 대시보드 통계 조회

**인증:** 필요

**쿼리 파라미터:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| period | string | N | 기간 (week, month, year, 기본: week) |

**응답 (200):**
```json
{
  "data": {
    "reviews": {
      "total": 45,
      "replied": 38,
      "pending": 5,
      "skipped": 2,
      "replyRate": 84.4,
      "averageRating": 4.7,
      "ratingTrend": [4.5, 4.6, 4.7, 4.8, 4.7]
    },
    "posts": {
      "total": 12,
      "published": 10,
      "scheduled": 2
    },
    "aiUsage": {
      "reviewResponses": 38,
      "captionGenerations": 15,
      "limit": 100,
      "usagePercent": 53
    },
    "period": {
      "start": "2025-11-18T00:00:00Z",
      "end": "2025-11-25T23:59:59Z"
    }
  }
}
```

---

## 9. 에러 코드 참조

### 인증 에러 (AUTH_*)

| Code | HTTP Status | Message |
|------|-------------|---------|
| AUTH_INVALID_TOKEN | 401 | 유효하지 않은 토큰입니다 |
| AUTH_TOKEN_EXPIRED | 401 | 토큰이 만료되었습니다 |
| AUTH_INSUFFICIENT_PERMISSION | 403 | 권한이 부족합니다 |

### 검증 에러 (VALIDATION_*)

| Code | HTTP Status | Message |
|------|-------------|---------|
| VALIDATION_REQUIRED_FIELD | 400 | 필수 필드가 누락되었습니다 |
| VALIDATION_INVALID_FORMAT | 400 | 입력 형식이 올바르지 않습니다 |

### 리소스 에러 (RESOURCE_*)

| Code | HTTP Status | Message |
|------|-------------|---------|
| RESOURCE_NOT_FOUND | 404 | 리소스를 찾을 수 없습니다 |
| RESOURCE_ALREADY_EXISTS | 409 | 이미 존재하는 리소스입니다 |

### 외부 서비스 에러 (EXTERNAL_*)

| Code | HTTP Status | Message |
|------|-------------|---------|
| EXTERNAL_GOOGLE_ERROR | 502 | Google API 오류가 발생했습니다 |
| EXTERNAL_INSTAGRAM_ERROR | 502 | Instagram API 오류가 발생했습니다 |
| EXTERNAL_OPENAI_ERROR | 502 | AI 서비스 오류가 발생했습니다 |

### 제한 에러 (LIMIT_*)

| Code | HTTP Status | Message |
|------|-------------|---------|
| LIMIT_RATE_EXCEEDED | 429 | 요청 한도를 초과했습니다 |
| LIMIT_QUOTA_EXCEEDED | 429 | 사용량 한도를 초과했습니다 |

---

## 10. Rate Limiting

| 엔드포인트 카테고리 | 제한 |
|-------------------|------|
| 인증 API | 10 req/min |
| AI 생성 API | 20 req/min |
| 일반 API | 100 req/min |
| 파일 업로드 | 10 req/min |

**Rate Limit 헤더:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700906400
```

---

*이 문서는 API 변경에 따라 지속적으로 업데이트됩니다.*
