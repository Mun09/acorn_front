"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/Button";
import { ProfileContent } from "@/features/profile/ProfileContent";

export default function ProfilePage() {
  const { data: session, isLoading: sessionLoading } = useSession();

  if (sessionLoading) return null;

  if (!session?.isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h2 className="text-xl font-semibold mb-4">프로필 보기</h2>
        <p className="text-muted-foreground mb-4">
          로그인해야 개인 프로필을 볼 수 있습니다.
        </p>
        <Link href="/login" className="inline-block">
          <Button>로그인</Button>
        </Link>
      </div>
    );
  }

  // 세션이 확정된 뒤에만 "내용 컴포넌트" 렌더 → 내부 훅 순서가 항상 일정
  const handle = session.user?.handle;
  return <ProfileContent profileHandle={handle} viewerHandle={handle} />;
}
