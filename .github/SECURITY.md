# 보안 정책 (Security Policy)

## 지원 버전

현재 보안 업데이트가 지원되는 버전입니다.

| 버전 | 지원 여부 |
| ------- | ------------------ |
| 0.4.x   | :white_check_mark: |
| 0.3.x   | :white_check_mark: |
| < 0.3   | :x:                |

## 보안 취약점 신고

보안 취약점을 발견하셨나요? 먼저 감사드립니다!

**중요: 보안 취약점은 공개 GitHub Issues로 등록하지 마세요.**

### 신고 방법

1. **이메일 신고**: [security@salonmate.kr](mailto:security@salonmate.kr)로 이메일을 보내주세요.

2. **GitHub Security Advisories**: [Security Advisories](https://github.com/Prometheus-P/salon-mate/security/advisories)를 통해 비공개로 신고할 수 있습니다.

### 신고 시 포함해야 할 정보

- 취약점 유형 (예: XSS, SQL Injection, CSRF 등)
- 취약점이 발생하는 위치 (파일 경로, URL 등)
- 재현 단계 (step-by-step)
- 잠재적 영향
- 가능하다면 PoC (Proof of Concept)

### 응답 시간

- **초기 응답**: 24시간 이내
- **상태 업데이트**: 72시간 이내
- **해결**: 심각도에 따라 다름
  - Critical: 7일 이내
  - High: 14일 이내
  - Medium: 30일 이내
  - Low: 60일 이내

### 보상 프로그램

현재 공식적인 버그 바운티 프로그램은 운영하지 않지만, 유효한 취약점을 신고해 주신 분들께는 감사의 표시로 Hall of Fame에 등재해 드립니다.

## 보안 모범 사례

### 개발자를 위한 가이드

1. **의존성 관리**
   - 정기적으로 `npm audit` / `pip-audit` 실행
   - Dependabot 알림 즉시 처리

2. **코드 보안**
   - OWASP Top 10 취약점 인지
   - 입력값 검증 필수
   - SQL 쿼리 파라미터화
   - XSS 방지를 위한 출력 이스케이핑

3. **인증/인가**
   - 최소 권한 원칙 적용
   - 세션 관리 보안

4. **민감 정보**
   - 절대 코드에 시크릿 하드코딩 금지
   - 환경 변수 또는 시크릿 매니저 사용

## 연락처

- **보안 이메일**: [security@salonmate.kr](mailto:security@salonmate.kr)
- **PGP Key**: [추후 제공 예정]

---

*이 보안 정책은 정기적으로 검토 및 업데이트됩니다.*
