# Acorn Frontend - 프로젝트 구조

```
acorn_front/
├── 📁 src/
│   ├── 📁 app/                    # Next.js App Router
│   │   ├── globals.css            # 전역 CSS (Tailwind)
│   │   ├── layout.tsx             # 루트 레이아웃
│   │   ├── page.tsx               # 홈페이지
│   │   ├── 📁 auth/               # 인증 페이지
│   │   │   ├── 📁 login/          # 로그인 페이지
│   │   │   └── 📁 signup/         # 회원가입 페이지
│   │   ├── 📁 dashboard/          # 대시보드
│   │   ├── 📁 profile/            # 프로필 페이지
│   │   └── 📁 api/                # API 라우트
│   │
│   ├── 📁 components/             # 재사용 UI 컴포넌트
│   │   ├── 📁 ui/                 # 기본 UI 컴포넌트
│   │   │   └── index.tsx          # Button, Input, Card 등
│   │   ├── 📁 layout/             # 레이아웃 컴포넌트
│   │   │   ├── Header.tsx         # 헤더
│   │   │   ├── Sidebar.tsx        # 사이드바
│   │   │   └── Footer.tsx         # 푸터
│   │   └── 📁 common/             # 공통 컴포넌트
│   │       ├── LoadingSpinner.tsx
│   │       └── ErrorBoundary.tsx
│   │
│   ├── 📁 features/               # 기능별 모듈화
│   │   ├── 📁 auth/               # 인증 관련
│   │   │   ├── components.tsx     # 로그인/회원가입 폼
│   │   │   ├── hooks.ts           # 인증 훅
│   │   │   └── types.ts           # 인증 타입
│   │   ├── 📁 posts/              # 포스트 기능
│   │   ├── 📁 profile/            # 프로필 관리
│   │   └── 📁 feed/               # 피드 관련
│   │
│   ├── 📁 hooks/                  # 커스텀 React 훅
│   │   └── index.ts               # useAuth, useApi, useLocalStorage 등
│   │
│   ├── 📁 lib/                    # 유틸리티 라이브러리
│   │   ├── api.ts                 # API 클라이언트 (Axios)
│   │   ├── utils.ts               # 공통 유틸리티
│   │   └── constants.ts           # 상수 정의
│   │
│   └── 📁 types/                  # TypeScript 타입
│       └── index.ts               # API, User, Post 등 타입
│
├── 📄 package.json                # 의존성 및 스크립트
├── 📄 next.config.js              # Next.js 설정
├── 📄 tailwind.config.js          # Tailwind CSS 설정
├── 📄 tsconfig.json               # TypeScript 설정
├── 📄 postcss.config.js           # PostCSS 설정
├── 📄 .env.local                  # 환경변수
└── 📄 README.md                   # 프로젝트 문서
```

## 🎯 주요 특징

### 📱 **App Router 구조**

- Next.js 14의 최신 App Router 사용
- 파일 시스템 기반 라우팅
- 서버 컴포넌트와 클라이언트 컴포넌트 혼용

### 🎨 **스타일링**

- Tailwind CSS로 유틸리티 우선 스타일링
- CSS Variables를 활용한 테마 시스템
- 다크모드 지원 준비

### 🔐 **인증 시스템**

- JWT Access + Refresh Token 구조
- 자동 토큰 갱신 (API 인터셉터)
- 보호된 라우트 관리

### 🔗 **API 통합**

- Axios 기반 HTTP 클라이언트
- 요청/응답 인터셉터로 토큰 관리
- TypeScript 타입 안전성

### 🧩 **컴포넌트 구조**

- 재사용 가능한 UI 컴포넌트
- 기능별 모듈화 (features/)
- 커스텀 훅으로 로직 분리

## 🚀 **스크립트 명령어**

```json
{
  "dev": "next dev", // 개발 서버
  "build": "next build", // 프로덕션 빌드
  "start": "next start", // 프로덕션 서버
  "lint": "next lint", // ESLint 검사
  "type-check": "tsc --noEmit", // 타입 체크
  "format": "prettier --write ." // 코드 포맷팅
}
```

## 📦 **주요 의존성**

- **Next.js 14**: React 프레임워크
- **TypeScript**: 타입 안전성
- **Tailwind CSS**: 유틸리티 우선 CSS
- **Axios**: HTTP 클라이언트
- **React Hook Form**: 폼 관리
- **Zustand**: 상태 관리 (필요시)
- **Lucide React**: 아이콘
