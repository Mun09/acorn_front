"use client";

import { useParams } from "next/navigation";
import { ProfileContent } from "@/features/profile/ProfileContent";
import { useSession } from "@/hooks";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function UserProfilePage() {
  const { data: session, isLoading: sessionLoading } = useSession();
  const { handle } = useParams<{ handle: string }>();

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

  return (
    <ProfileContent
      profileHandle={handle}
      viewerHandle={session?.user?.handle}
    />
  );
}
