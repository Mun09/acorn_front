# Acorn Frontend

Next.js 기반의 Acorn 프론트엔드 애플리케이션입니다.

## 🚀 빠른 시작

### 설치

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev

# 브라우저에서 http://localhost:3000 접속
```

### 빌드

```bash
# 프로덕션 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start
```

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # 전역 CSS (Tailwind 포함)
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 홈페이지
│   ├── auth/              # 인증 관련 페이지
│   │   ├── login/         # 로그인 페이지
│   │   └── signup/        # 회원가입 페이지
│   ├── dashboard/         # 대시보드
│   ├── profile/           # 프로필 관련
│   └── api/               # API 라우트 (프록시 등)
├── components/            # 재사용 가능한 UI 컴포넌트
│   ├── ui/                # 기본 UI 컴포넌트
│   │   ├── Button.tsx     # 버튼 컴포넌트
│   │   ├── Input.tsx      # 입력 필드
│   │   ├── Card.tsx       # 카드 레이아웃
│   │   └── index.tsx      # 컴포넌트 export
│   ├── layout/            # 레이아웃 컴포넌트
│   │   ├── Header.tsx     # 헤더
│   │   ├── Sidebar.tsx    # 사이드바
│   │   └── Footer.tsx     # 푸터
│   └── common/            # 공통 컴포넌트
│       ├── LoadingSpinner.tsx
│       └── ErrorBoundary.tsx
├── features/              # 기능별 모듈
│   ├── auth/              # 인증 관련
│   │   ├── components.tsx # 로그인/회원가입 폼
│   │   ├── hooks.ts       # 인증 관련 훅
│   │   └── types.ts       # 인증 타입
│   ├── posts/             # 포스트 관련
│   │   ├── components/    # 포스트 컴포넌트들
│   │   ├── hooks.ts       # 포스트 관련 훅
│   │   └── types.ts       # 포스트 타입
│   ├── profile/           # 프로필 관련
│   └── feed/              # 피드 관련
├── hooks/                 # 커스텀 React 훅
│   ├── useAuth.ts         # 인증 상태 관리
│   ├── useApi.ts          # API 호출 관리
│   ├── useLocalStorage.ts # 로컬 스토리지
│   └── index.ts           # 훅 export
├── lib/                   # 유틸리티 라이브러리
│   ├── api.ts             # API 클라이언트 설정
│   ├── utils.ts           # 공통 유틸리티 함수
│   ├── auth.ts            # 인증 관련 유틸리티
│   └── constants.ts       # 상수 정의
└── types/                 # TypeScript 타입 정의
    ├── api.ts             # API 응답 타입
    ├── user.ts            # 사용자 관련 타입
    ├── post.ts            # 포스트 관련 타입
    └── index.ts           # 타입 export
```

## 🛠 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand (필요 시)
- **HTTP Client**: Axios
- **Forms**: React Hook Form
- **Package Manager**: pnpm

## 📋 주요 기능

### 인증 시스템

- 로그인/회원가입
- JWT 토큰 관리 (Access + Refresh Token)
- 자동 토큰 갱신
- 보호된 라우트

### 사용자 인터페이스

- 반응형 디자인
- 다크 모드 지원
- 로딩 상태 관리
- 에러 핸들링

### API 통합

- 백엔드 API 연동
- 요청/응답 인터셉터
- 에러 처리
- 타입 안전성

## 🔧 개발 가이드

### 환경 변수

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=Acorn
```

### 코딩 컨벤션

- **컴포넌트**: PascalCase (예: `UserProfile.tsx`)
- **훅**: camelCase with use prefix (예: `useAuth.ts`)
- **유틸리티**: camelCase (예: `formatDate.ts`)
- **타입**: PascalCase with Type/Interface suffix

### 새 컴포넌트 추가

```typescript
// src/components/ui/NewComponent.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface NewComponentProps {
  className?: string;
  children: React.ReactNode;
}

export const NewComponent: React.FC<NewComponentProps> = ({
  className,
  children,
}) => {
  return (
    <div className={cn('base-styles', className)}>
      {children}
    </div>
  );
};
```

### 새 페이지 추가

```typescript
// src/app/new-page/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Page',
  description: 'Description of the new page',
};

export default function NewPage() {
  return (
    <div>
      <h1>New Page</h1>
    </div>
  );
}
```

## 📝 스크립트 명령어

```bash
# 개발 서버 실행
pnpm dev

# 타입 체크
pnpm type-check

# 린트 검사
pnpm lint

# 린트 자동 수정
pnpm lint:fix

# 코드 포맷팅
pnpm format

# 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start

# 의존성 정리
pnpm clean
```

## 🤝 기여하기

1. 브랜치 생성 (`git checkout -b feature/새기능`)
2. 변경사항 커밋 (`git commit -am '새 기능 추가'`)
3. 브랜치 푸시 (`git push origin feature/새기능`)
4. Pull Request 생성

## 📄 라이센스

MIT License
