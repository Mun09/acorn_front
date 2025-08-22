"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import LoginForm from "@/features/auth/LoginForm";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, isLoading } = useSession();

  useEffect(() => {
    // 로그인된 상태라면 홈페이지로 리다이렉트
    if (!isLoading && session?.isAuthenticated) {
      router.push("/");
    }
  }, [session, isLoading, router]);

  // 로딩 중이거나 이미 로그인된 경우 로딩 표시
  if (isLoading || session?.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return <LoginForm />;
}
