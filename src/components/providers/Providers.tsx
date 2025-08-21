"use client";

import React, { ReactNode, useState, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";

interface ProvidersProps {
  children: ReactNode;
}

// 로딩 컴포넌트
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 bg-primary rounded-full animate-bounce"></div>
        <div
          className="w-4 h-4 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: "0.1s" }}
        ></div>
        <div
          className="w-4 h-4 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        ></div>
      </div>
    </div>
  );
}

// 에러 바운더리
class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">
              오류가 발생했습니다
            </h2>
            <p className="text-muted-foreground">
              페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function Providers({ children }: ProvidersProps) {
  // Query Client 생성 (컴포넌트 내부에서 생성하여 SSR 이슈 방지)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 기본 옵션 설정
            staleTime: 1000 * 60 * 5, // 5분
            gcTime: 1000 * 60 * 30, // 30분 (구 cacheTime)
            retry: (failureCount, error: any) => {
              // 401, 403, 404는 재시도하지 않음
              if (error?.status && [401, 403, 404].includes(error.status)) {
                return false;
              }
              return failureCount < 3;
            },
            refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 리페치 비활성화
          },
          mutations: {
            // 뮤테이션 기본 옵션
            retry: false,
          },
        },
      })
  );

  return (
    <ErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<LoadingFallback />}>{children}</Suspense>

          {/* React Hot Toast */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "hsl(var(--background))",
                color: "hsl(var(--foreground))",
                border: "1px solid hsl(var(--border))",
              },
              success: {
                iconTheme: {
                  primary: "hsl(var(--primary))",
                  secondary: "hsl(var(--primary-foreground))",
                },
              },
              error: {
                iconTheme: {
                  primary: "hsl(var(--destructive))",
                  secondary: "hsl(var(--destructive-foreground))",
                },
              },
            }}
          />
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
