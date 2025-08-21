"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useEffect } from "react";
import { useSession } from "@/hooks/useSession";
import { postsApi } from "@/lib/api";
import { PostCard } from "@/features/posts/PostCard";
import { PostComposer } from "@/features/posts/PostComposer";
import { Button } from "@/components/ui/Button";
import { RefreshCw, AlertCircle, Users } from "lucide-react";
import Link from "next/link";

// 스켈레톤 카드 컴포넌트
function PostSkeleton() {
  return (
    <div className="border-b border-border p-4 animate-pulse">
      <div className="flex space-x-3">
        <div className="w-10 h-10 bg-muted rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center space-x-2">
            <div className="h-4 bg-muted rounded w-20" />
            <div className="h-4 bg-muted rounded w-12" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
          <div className="flex items-center space-x-8">
            <div className="h-4 bg-muted rounded w-12" />
            <div className="h-4 bg-muted rounded w-12" />
            <div className="h-4 bg-muted rounded w-12" />
            <div className="h-4 bg-muted rounded w-8" />
          </div>
        </div>
      </div>
    </div>
  );
}

// 간단한 Intersection Observer 훅
function useIntersectionObserver(callback: () => void, deps: any[]) {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, deps);

  return targetRef;
}

export default function FollowingPage() {
  const { data: session, isLoading: sessionLoading } = useSession();
  const queryClient = useQueryClient();

  // Following 피드 데이터 가져오기
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["posts", "following"],
    queryFn: async ({ pageParam = undefined }) => {
      const params = new URLSearchParams({
        mode: "following",
        limit: "20",
      });
      if (pageParam) {
        params.append("cursor", pageParam);
      }
      return postsApi.getFeed(params.toString());
    },
    getNextPageParam: (lastPage: any) => {
      return lastPage.data?.nextCursor || undefined;
    },
    initialPageParam: undefined,
    enabled: !!session?.isAuthenticated, // 로그인된 사용자만 실행
  });

  // 무한 스크롤을 위한 Intersection Observer
  const loadMoreRef = useIntersectionObserver(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage]);

  // 포스트 작성 성공 시 피드 새로고침
  const handlePostSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["posts", "following"] });
  };

  // 모든 포스트 플래튼화
  const posts =
    data?.pages.flatMap((page: any) => page.data?.posts || []) || [];

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  // 로그인하지 않은 사용자에게 로그인 요구
  if (!session?.isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12 space-y-6">
          <div className="space-y-3">
            <Users className="w-16 h-16 text-muted-foreground mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">
              팔로잉 피드는 로그인이 필요합니다
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              팔로우한 사용자들의 최신 포스트를 확인하려면 먼저 로그인해주세요.
            </p>
          </div>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button>로그인</Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline">회원가입</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* 포스트 작성기 */}
      <div className="border-b border-border p-4">
        <PostComposer onSuccess={handlePostSuccess} />
      </div>

      {/* 피드 헤더 */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border p-4 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Following</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 에러 상태 */}
      {isError && (
        <div className="border-b border-border p-6 text-center">
          <div className="flex flex-col items-center space-y-3">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <div>
              <p className="text-foreground font-medium">
                피드를 불러오는 중 오류가 발생했습니다
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {error?.message || "알 수 없는 오류"}
              </p>
            </div>
            <Button onClick={() => refetch()} variant="outline">
              다시 시도
            </Button>
          </div>
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading && (
        <div>
          {Array.from({ length: 5 }).map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      )}

      {/* 포스트 목록 */}
      {!isLoading && posts.length > 0 && (
        <div>
          {posts.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* 무한 스크롤 트리거 */}
      {hasNextPage && <div ref={loadMoreRef} className="h-1" />}

      {/* 추가 로딩 */}
      {isFetchingNextPage && (
        <div>
          {Array.from({ length: 3 }).map((_, i) => (
            <PostSkeleton key={`loading-${i}`} />
          ))}
        </div>
      )}

      {/* 더 이상 로드할 포스트가 없을 때 */}
      {!isLoading && !hasNextPage && posts.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          모든 포스트를 확인했습니다
        </div>
      )}

      {/* 포스트가 없을 때 */}
      {!isLoading && posts.length === 0 && !isError && (
        <div className="text-center py-12">
          <div className="space-y-6">
            <div className="space-y-3">
              <Users className="w-16 h-16 text-muted-foreground mx-auto" />
              <p className="text-lg text-muted-foreground">
                팔로잉 피드가 비어있습니다
              </p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                흥미로운 사용자들을 팔로우하여 그들의 최신 포스트를
                확인해보세요.
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <Link href="/users">
                <Button>사용자 찾기</Button>
              </Link>
              <Link href="/">
                <Button variant="outline">For You 피드 보기</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
