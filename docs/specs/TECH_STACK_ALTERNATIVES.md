# 기술 스택 대안 제안 및 비교 분석

> **문서 목적**: Next.js와 FastAPI를 제외한 대안 기술 스택 제안 및 비교 분석
>
> **작성일**: 2025-11-25
>
> **대상 프로젝트**: SalonMate - AI 기반 뷰티샵 마케팅 자동화 플랫폼

---

## 목차

1. [프로젝트 요구사항 요약](#1-프로젝트-요구사항-요약)
2. [대안 기술 스택 제안](#2-대안-기술-스택-제안)
3. [상세 비교 분석](#3-상세-비교-분석)
4. [시나리오별 권장 사항](#4-시나리오별-권장-사항)
5. [최종 결론](#5-최종-결론)

---

## 1. 프로젝트 요구사항 요약

### 핵심 기능 요구사항

| 영역 | 요구사항 |
|------|----------|
| **리뷰 자동 응답** | Google Business Profile API, 네이버 (수동 워크플로우) |
| **콘텐츠 생성** | Instagram 캡션/해시태그 AI 생성, 자동 포스팅 |
| **대시보드** | 마케팅 성과 모니터링, 실시간 데이터 |
| **모바일** | iOS/Android 네이티브 앱 지원 |
| **인증** | JWT + OAuth 2.0 (Google, Kakao) |
| **AI 통합** | LLM API 호출, 프롬프트 관리, 비용 최적화 |

### 비기능 요구사항

| 항목 | 요구 수준 |
|------|-----------|
| **동시 사용자** | MVP 100명, 확장 시 1,000+ |
| **응답 시간** | API 95th percentile < 500ms |
| **가용성** | 99.5% uptime |
| **개발 속도** | MVP 3개월 내 출시 목표 |
| **팀 규모** | 2-3명 소규모 팀 |
| **예산** | 초기 인프라 비용 최소화 |

---

## 2. 대안 기술 스택 제안

### Option A: Full-Stack TypeScript (Remix + tRPC + Prisma)

```
┌─────────────────────────────────────────────────────────────────┐
│                     OPTION A: Remix Stack                       │
├─────────────────────────────────────────────────────────────────┤
│  Frontend                                                       │
│  ├── Remix v2 (App Router, SSR/SSG)                            │
│  ├── React 18 + TypeScript                                      │
│  ├── Tailwind CSS + Radix UI                                    │
│  └── TanStack Query (옵션)                                      │
├─────────────────────────────────────────────────────────────────┤
│  Backend (동일 모노레포)                                         │
│  ├── Remix Actions/Loaders (BFF 패턴)                           │
│  ├── tRPC (타입 안전 API)                                       │
│  ├── Prisma ORM                                                 │
│  └── BullMQ (작업 큐)                                           │
├─────────────────────────────────────────────────────────────────┤
│  AI Worker (별도 서비스)                                        │
│  ├── Node.js Worker (BullMQ)                                    │
│  └── LangChain.js                                               │
├─────────────────────────────────────────────────────────────────┤
│  Infrastructure                                                 │
│  ├── Database: Supabase PostgreSQL                              │
│  ├── Hosting: Vercel (Edge Functions)                           │
│  ├── Queue: Upstash Redis                                       │
│  └── Storage: Supabase Storage                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Option B: SvelteKit Full-Stack + Go Backend

```
┌─────────────────────────────────────────────────────────────────┐
│                   OPTION B: SvelteKit + Go                      │
├─────────────────────────────────────────────────────────────────┤
│  Frontend                                                       │
│  ├── SvelteKit 2.0 (SSR/SSG/SPA)                               │
│  ├── Svelte 5 (Runes)                                           │
│  ├── Tailwind CSS + Skeleton UI                                 │
│  └── Capacitor (모바일)                                         │
├─────────────────────────────────────────────────────────────────┤
│  Backend API                                                    │
│  ├── Go 1.22 + Echo/Fiber                                       │
│  ├── sqlc (타입 안전 SQL)                                       │
│  ├── golang-migrate                                             │
│  └── Asynq (Redis 기반 작업 큐)                                 │
├─────────────────────────────────────────────────────────────────┤
│  AI Worker                                                      │
│  ├── Python 3.12 (LangChain 전용)                               │
│  └── gRPC 통신                                                  │
├─────────────────────────────────────────────────────────────────┤
│  Infrastructure                                                 │
│  ├── Database: PlanetScale / Neon PostgreSQL                    │
│  ├── Hosting: Vercel (Frontend) + Fly.io (Go)                   │
│  ├── Queue: Upstash Redis                                       │
│  └── Storage: Cloudflare R2                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Option C: Nuxt.js + Django (Python 통합)

```
┌─────────────────────────────────────────────────────────────────┐
│                   OPTION C: Nuxt + Django                       │
├─────────────────────────────────────────────────────────────────┤
│  Frontend                                                       │
│  ├── Nuxt 3 (Vue 3 Composition API)                            │
│  ├── TypeScript                                                 │
│  ├── Tailwind CSS + Nuxt UI                                     │
│  └── Pinia (상태 관리)                                          │
├─────────────────────────────────────────────────────────────────┤
│  Backend                                                        │
│  ├── Django 5.0 + Django REST Framework                         │
│  ├── Celery + Redis (작업 큐)                                   │
│  ├── Django ORM                                                 │
│  └── dj-rest-auth (인증)                                        │
├─────────────────────────────────────────────────────────────────┤
│  AI Integration                                                 │
│  ├── LangChain (Python 네이티브)                                │
│  └── Django Q2 또는 Celery Task                                 │
├─────────────────────────────────────────────────────────────────┤
│  Infrastructure                                                 │
│  ├── Database: Supabase PostgreSQL                              │
│  ├── Hosting: Vercel (Nuxt) + Railway (Django)                  │
│  ├── Queue: Redis (Upstash)                                     │
│  └── Storage: AWS S3                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Option D: Astro + NestJS (Enterprise Ready)

```
┌─────────────────────────────────────────────────────────────────┐
│                   OPTION D: Astro + NestJS                      │
├─────────────────────────────────────────────────────────────────┤
│  Frontend                                                       │
│  ├── Astro 4.0 (Island Architecture)                           │
│  ├── React/Vue Islands (인터랙티브 컴포넌트)                    │
│  ├── Tailwind CSS                                               │
│  └── Astro View Transitions                                     │
├─────────────────────────────────────────────────────────────────┤
│  Backend                                                        │
│  ├── NestJS (TypeScript, DI 기반)                               │
│  ├── TypeORM / Prisma                                           │
│  ├── Bull (작업 큐)                                             │
│  └── Passport.js (인증)                                         │
├─────────────────────────────────────────────────────────────────┤
│  AI Worker                                                      │
│  ├── Python Microservice (FastAPI 또는 Flask)                   │
│  └── REST/gRPC 통신                                             │
├─────────────────────────────────────────────────────────────────┤
│  Infrastructure                                                 │
│  ├── Database: PostgreSQL (자체 호스팅 또는 Supabase)           │
│  ├── Hosting: Cloudflare Pages + Railway                        │
│  ├── Queue: Redis                                               │
│  └── Storage: Cloudflare R2                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 상세 비교 분석

### 3.1 Frontend 프레임워크 비교

#### Next.js vs Remix vs SvelteKit vs Nuxt.js vs Astro

| 항목 | Next.js 14 | Remix v2 | SvelteKit 2 | Nuxt 3 | Astro 4 |
|------|-----------|----------|-------------|--------|---------|
| **성숙도** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **성능 (TTI)** | 좋음 | 매우 좋음 | 우수 | 좋음 | 우수 |
| **번들 크기** | 큼 (80-120KB) | 중간 (60-90KB) | 작음 (30-50KB) | 중간 (70-100KB) | 매우 작음 (0-30KB) |
| **학습 곡선** | 중간 | 중간 | 낮음 | 중간 | 낮음 |
| **생태계** | 매우 큼 | 큼 | 중간 | 큼 | 성장 중 |
| **SSR/SSG** | 둘 다 | SSR 중심 | 둘 다 | 둘 다 | SSG 중심 |
| **서버 액션** | ✅ (App Router) | ✅ (네이티브) | ✅ (Form Actions) | ✅ (useFetch) | ❌ |
| **TypeScript** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Vercel 최적화** | 완벽 | 좋음 | 좋음 | 좋음 | 좋음 |
| **채용 시장** | 매우 큼 | 성장 중 | 성장 중 | 큼 | 작음 |

#### 세부 분석

**Remix의 장점 (vs Next.js)**
```typescript
// Remix: 웹 표준 기반의 직관적인 데이터 로딩
// loader는 서버에서만 실행, 자동으로 클라이언트에 전달
export async function loader({ request }: LoaderFunctionArgs) {
  const reviews = await getReviews();
  return json({ reviews });
}

// action은 form submission 처리
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  await createReviewResponse(formData);
  return redirect('/reviews');
}

// 컴포넌트는 데이터 로딩 로직과 분리
export default function Reviews() {
  const { reviews } = useLoaderData<typeof loader>();
  return <ReviewList reviews={reviews} />;
}
```

- **웹 표준 API 사용**: Request/Response, FormData 등 표준 API
- **중첩 라우팅**: 레이아웃과 데이터 로딩의 자연스러운 분리
- **프로그레시브 인핸스먼트**: JavaScript 없이도 동작하는 폼
- **에러 바운더리**: 라우트 레벨의 에러 처리

**SvelteKit의 장점 (vs Next.js)**
```svelte
<!-- SvelteKit: 간결한 문법과 뛰어난 성능 -->
<script lang="ts">
  export let data; // 서버에서 로드된 데이터

  let rating = 5;
  $: filteredReviews = data.reviews.filter(r => r.rating >= rating);
</script>

<!-- 반응성이 내장된 템플릿 -->
<input type="range" bind:value={rating} min="1" max="5" />

{#each filteredReviews as review (review.id)}
  <ReviewCard {review} />
{/each}
```

- **제로 런타임 오버헤드**: 컴파일 타임에 최적화
- **간결한 문법**: 보일러플레이트 최소화
- **내장 반응성**: 상태 관리 라이브러리 불필요
- **작은 번들 크기**: React 대비 60-70% 감소

**Nuxt 3의 장점 (vs Next.js)**
```vue
<!-- Nuxt 3: Vue의 Composition API + 자동 임포트 -->
<script setup lang="ts">
// 자동 임포트: useState, useFetch 등
const { data: reviews } = await useFetch('/api/reviews')

const searchQuery = ref('')
const filteredReviews = computed(() =>
  reviews.value?.filter(r => r.content.includes(searchQuery.value))
)
</script>

<template>
  <input v-model="searchQuery" placeholder="검색..." />
  <ReviewCard
    v-for="review in filteredReviews"
    :key="review.id"
    :review="review"
  />
</template>
```

- **자동 임포트**: 유틸리티, 컴포넌트 자동 등록
- **Vue DevTools**: 뛰어난 디버깅 경험
- **Nitro 서버 엔진**: 엣지 배포 최적화
- **큰 생태계**: Nuxt UI, VueUse 등

**Astro의 장점 (vs Next.js)**
```astro
---
// Astro: 제로 JS 기본, 필요한 곳만 Hydration
import ReviewCard from '../components/ReviewCard.svelte';
import Dashboard from '../components/Dashboard.tsx';

const reviews = await getReviews();
---

<html>
  <body>
    <!-- 정적 콘텐츠: JS 없음 -->
    <h1>리뷰 관리</h1>

    <!-- Svelte 컴포넌트: client:visible로 뷰포트 진입 시 hydration -->
    {reviews.map(review => (
      <ReviewCard {review} client:visible />
    ))}

    <!-- React 컴포넌트: 즉시 hydration -->
    <Dashboard client:load />
  </body>
</html>
```

- **아일랜드 아키텍처**: 필요한 컴포넌트만 hydration
- **프레임워크 무관**: React, Vue, Svelte 혼용 가능
- **최소 JS 전송**: 콘텐츠 중심 사이트에 최적
- **빌드 성능**: 빠른 빌드 시간

### 3.2 Backend 프레임워크 비교

#### FastAPI vs NestJS vs Django vs Go (Echo/Fiber)

| 항목 | FastAPI | NestJS | Django 5 | Go (Echo) |
|------|---------|--------|----------|-----------|
| **성숙도** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **성능 (req/s)** | ~15,000 | ~10,000 | ~5,000 | ~100,000+ |
| **메모리 사용** | 중간 | 높음 | 높음 | 매우 낮음 |
| **타입 안전성** | ⭐⭐⭐⭐⭐ (Pydantic) | ⭐⭐⭐⭐⭐ (TS) | ⭐⭐⭐ (선택적) | ⭐⭐⭐⭐⭐ (정적) |
| **API 문서 자동화** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **ORM 생태계** | SQLAlchemy | TypeORM/Prisma | Django ORM | sqlc/GORM |
| **비동기 지원** | 네이티브 | 네이티브 | 부분적 (ASGI) | 고루틴 |
| **학습 곡선** | 낮음 | 중간 | 중간 | 높음 |
| **AI/ML 통합** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **채용 시장 (한국)** | 성장 중 | 큼 | 큼 | 성장 중 |
| **배포 비용** | 중간 | 중간 | 높음 | 낮음 |

#### 세부 분석

**NestJS의 장점 (vs FastAPI)**
```typescript
// NestJS: 엔터프라이즈급 아키텍처
@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly aiService: AIService, // 의존성 주입
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '리뷰 목록 조회' })
  async findAll(@Query() query: FindReviewsDto): Promise<ReviewResponseDto[]> {
    return this.reviewsService.findAll(query);
  }

  @Post(':id/respond')
  @UseInterceptors(CacheInterceptor) // AOP 스타일 횡단 관심사
  async respond(
    @Param('id') id: string,
    @Body() dto: CreateResponseDto,
  ): Promise<ReviewResponse> {
    return this.reviewsService.createResponse(id, dto);
  }
}
```

- **의존성 주입**: 테스트 용이성, 모듈화
- **데코레이터 기반**: 선언적 API 정의
- **TypeScript 네이티브**: 프론트엔드와 타입 공유
- **모듈 시스템**: 대규모 애플리케이션 구조화

**Django의 장점 (vs FastAPI)**
```python
# Django: 배터리 포함, 빠른 개발
from django.db import models
from django.contrib.admin import site

class Review(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE)
    rating = models.IntegerField()
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

# 자동 Admin 패널
site.register(Review)

# DRF ViewSet: CRUD 자동 생성
class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.select_related('shop')
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['shop', 'rating']
    search_fields = ['content']
```

- **Admin 패널**: 즉시 사용 가능한 관리 UI
- **ORM 성숙도**: 복잡한 쿼리, 마이그레이션
- **보안**: CSRF, XSS 보호 내장
- **Python AI 생태계**: LangChain, NumPy 직접 사용

**Go (Echo)의 장점 (vs FastAPI)**
```go
// Go: 극한의 성능과 간결함
func main() {
    e := echo.New()

    // 미들웨어
    e.Use(middleware.Logger())
    e.Use(middleware.Recover())

    // 라우트
    api := e.Group("/api/v1")
    api.Use(middleware.JWTWithConfig(jwtConfig))

    reviews := api.Group("/reviews")
    reviews.GET("", getReviews)
    reviews.POST("/:id/respond", createResponse)

    e.Logger.Fatal(e.Start(":8080"))
}

func getReviews(c echo.Context) error {
    var reviews []Review
    if err := db.Find(&reviews).Error; err != nil {
        return c.JSON(500, map[string]string{"error": err.Error()})
    }
    return c.JSON(200, reviews)
}
```

- **성능**: FastAPI 대비 5-10배 처리량
- **메모리**: 1/10 수준의 메모리 사용
- **배포**: 단일 바이너리, 컨테이너 이미지 최소화
- **동시성**: 고루틴 기반 수십만 동시 연결

### 3.3 종합 비교표: 기존 vs 대안 스택

| 평가 기준 | 기존 (Next.js + FastAPI) | Option A (Remix + tRPC) | Option B (SvelteKit + Go) | Option C (Nuxt + Django) | Option D (Astro + NestJS) |
|----------|-------------------------|------------------------|--------------------------|-------------------------|-------------------------|
| **개발 속도** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **런타임 성능** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **번들 크기** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **타입 안전성** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **AI 통합 용이성** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **생태계 & 커뮤니티** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **한국 채용 시장** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **모바일 지원** | ⭐⭐⭐⭐ (Capacitor) | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **운영 비용** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **확장성** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **학습 곡선** | 중간 | 낮음-중간 | 높음 | 낮음 | 중간 |
| **종합 점수** | **40/50** | **39/50** | **40/50** | **39/50** | **39/50** |

---

## 4. 시나리오별 권장 사항

### 시나리오 1: 최대한 빠른 MVP 출시

**권장: Option C (Nuxt + Django)** 또는 **기존 스택 (Next.js + FastAPI)**

```
이유:
├── Django Admin으로 관리자 페이지 즉시 확보
├── Django ORM의 성숙한 마이그레이션 시스템
├── Python 생태계로 AI 통합 자연스러움
└── Nuxt 자동 임포트로 보일러플레이트 최소화
```

**예상 개발 기간**: 2.5-3개월

### 시나리오 2: 향후 대규모 확장 예상

**권장: Option B (SvelteKit + Go)**

```
이유:
├── Go 백엔드의 압도적 성능 (10만 req/s+)
├── 최소 메모리 사용으로 인프라 비용 절감
├── SvelteKit의 작은 번들로 모바일 UX 최적화
└── 단일 바이너리 배포로 운영 단순화
```

**주의사항**: Go 개발자 채용 어려움, AI 서비스는 Python 별도 구성

### 시나리오 3: 풀스택 TypeScript 통일

**권장: Option A (Remix + tRPC)**

```
이유:
├── 프론트엔드-백엔드 완전한 타입 공유
├── 단일 언어로 전체 스택 개발
├── tRPC로 API 계층 보일러플레이트 제거
└── 모노레포 구성으로 DX 향상
```

**주의사항**: AI 파이프라인은 LangChain.js 사용 (Python 대비 기능 부족)

### 시나리오 4: 콘텐츠/SEO 중심 서비스

**권장: Option D (Astro + NestJS)**

```
이유:
├── 아일랜드 아키텍처로 최소 JS
├── 정적 생성으로 CDN 캐싱 극대화
├── Core Web Vitals 점수 최적화
└── NestJS의 엔터프라이즈급 백엔드
```

**적합 케이스**: 블로그/랜딩 페이지가 중요한 경우

---

## 5. 최종 결론

### SalonMate 프로젝트에 대한 권장 사항

#### 기존 스택 유지 권장 (Next.js + FastAPI)

```
┌─────────────────────────────────────────────────────────────────┐
│                      최종 권장: 기존 스택 유지                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend: Next.js 14                                           │
│  ├── App Router + Server Components                             │
│  ├── Tailwind CSS + shadcn/ui                                   │
│  ├── TanStack Query + Zustand                                   │
│  └── Capacitor (모바일)                                         │
│                                                                 │
│  Backend: FastAPI                                               │
│  ├── SQLAlchemy 2.0 + Alembic                                   │
│  ├── Celery + Redis                                             │
│  └── LangChain + LangGraph                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 권장 이유

| 관점 | 기존 스택이 적합한 이유 |
|------|------------------------|
| **MVP 속도** | 가장 큰 생태계, 레퍼런스 풍부, 문제 해결 빠름 |
| **AI 통합** | Python 네이티브 환경에서 LangChain 최적 활용 |
| **채용 시장** | Next.js/FastAPI 개발자 한국 내 가장 많음 |
| **Vercel 최적화** | Next.js 제작사의 호스팅, 최상의 성능 |
| **커뮤니티** | 한국어 리소스 풍부 (벨로그, 인프런 등) |
| **문서 완성도** | 이미 작성된 스펙 문서와 100% 호환 |

#### 대안 고려 시점

기존 스택에서 **전환을 고려해야 할 시점**:

1. **월간 사용자 10,000명 초과** → Go 백엔드 검토
2. **프론트엔드 번들 성능 이슈** → SvelteKit 검토
3. **TypeScript 단일 스택 선호** → Remix + tRPC 검토
4. **SEO/콘텐츠 마케팅 강화** → Astro 검토

### 점진적 개선 제안

현재 스택을 유지하면서 선택적으로 적용 가능한 개선안:

```
Phase 1 (MVP): 현재 스택 그대로
├── Next.js 14 + FastAPI
└── 기능 개발에 집중

Phase 2 (성능 최적화):
├── Partial Prerendering (Next.js 15)
├── Redis 캐싱 강화
└── CDN 최적화

Phase 3 (선택적 전환):
├── 성능 병목 구간만 Go 마이크로서비스
├── 정적 페이지만 Astro로 분리
└── 필요시 백엔드 수평 확장
```

---

## 부록: 기술 스택별 예상 비용 비교

### 월간 운영 비용 (100 DAU 기준)

| 항목 | 기존 스택 | Option A | Option B | Option C | Option D |
|------|----------|----------|----------|----------|----------|
| Frontend Hosting | $20 (Vercel Pro) | $20 | $20 | $20 | $20 |
| Backend Hosting | $25 (Railway) | - | $10 (Fly.io) | $25 | $25 |
| Database | $25 (Supabase) | $25 | $25 | $25 | $25 |
| Redis | $10 (Upstash) | $10 | $10 | $10 | $10 |
| AI API | $50-100 | $50-100 | $50-100 | $50-100 | $50-100 |
| **월 총합** | **$130-175** | **$105-150** | **$115-165** | **$130-180** | **$130-180** |

---

*본 문서는 SalonMate 프로젝트의 기술 스택 결정을 위한 참고 자료입니다.*
