"use client";

import Link from "next/link";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/Button";
import { TrendingUp, Users, MessageCircle, Bookmark } from "lucide-react";

export default function HomePage() {
  const { data: session, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {session?.isAuthenticated ? (
        <>
          {/* 환영 메시지 */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              환영합니다, @{session.user.handle}님!
            </h1>
            <p className="text-muted-foreground">
              오늘도 흥미로운 금융 토론에 참여해보세요.
            </p>
          </div>

          {/* 대시보드 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">신뢰 점수</p>
                  <p className="text-xl font-bold text-foreground">
                    {session.user.trustScore}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">팔로워</p>
                  <p className="text-xl font-bold text-foreground">1.2K</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">게시물</p>
                  <p className="text-xl font-bold text-foreground">47</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Bookmark className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">북마크</p>
                  <p className="text-xl font-bold text-foreground">23</p>
                </div>
              </div>
            </div>
          </div>

          {/* 메인 피드 영역 */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              For You 피드
            </h2>
            <div className="space-y-4 text-center text-muted-foreground">
              <p>아직 피드가 비어있습니다.</p>
              <p>팔로우할 사용자를 찾아보거나 첫 게시물을 작성해보세요!</p>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center space-y-6 py-12">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Acorn에 오신 것을 환영합니다
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              금융과 투자에 대한 통찰력 있는 토론을 나누고, 신뢰할 수 있는
              커뮤니티에서 함께 성장하세요.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg">지금 시작하기</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                로그인
              </Button>
            </Link>
          </div>

          {/* 특징 소개 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="text-center space-y-2">
              <TrendingUp className="w-12 h-12 text-primary mx-auto" />
              <h3 className="text-lg font-semibold text-foreground">
                실시간 시장 분석
              </h3>
              <p className="text-sm text-muted-foreground">
                최신 시장 동향과 전문가들의 분석을 실시간으로 확인하세요.
              </p>
            </div>
            <div className="text-center space-y-2">
              <Users className="w-12 h-12 text-primary mx-auto" />
              <h3 className="text-lg font-semibold text-foreground">
                신뢰 기반 커뮤니티
              </h3>
              <p className="text-sm text-muted-foreground">
                검증된 투자자들과 함께 신뢰할 수 있는 정보를 공유하세요.
              </p>
            </div>
            <div className="text-center space-y-2">
              <MessageCircle className="w-12 h-12 text-primary mx-auto" />
              <h3 className="text-lg font-semibold text-foreground">
                깊이 있는 토론
              </h3>
              <p className="text-sm text-muted-foreground">
                수준 높은 금융 토론에 참여하고 인사이트를 나누세요.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
