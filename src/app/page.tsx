"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/hooks/useSession";
import { postsApi } from "@/lib/api";
import { PostCard } from "@/features/posts/PostCard";
import { PostComposer } from "@/features/posts/PostComposer";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

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

export default function HomePage() {
  const {
    data: session,
    isLoading: sessionLoading,
    error: sessionError,
    isError: sessionIsError,
  } = useSession();

  const queryClient = useQueryClient();
  const [feedMode, setFeedMode] = useState<"for_you" | "following">("for_you");
  const isAuthenticated = session?.isAuthenticated === true;

  // 피드 데이터 가져오기 (로그인된 사용자만)
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
    queryKey: ["posts", feedMode],
    queryFn: async ({ pageParam = undefined }) => {
      const params = new URLSearchParams({
        mode: feedMode,
        limit: "20",
      });
      if (pageParam) {
        params.append("cursor", pageParam);
      }
      console.log(params.toString());
      return postsApi.getFeed(params.toString());
    },
    getNextPageParam: (lastPage: any) => {
      return lastPage.data?.nextCursor || undefined;
    },
    initialPageParam: undefined,
    enabled: !sessionLoading && isAuthenticated, // 세션 로딩이 끝나고 인증된 사용자만
  });

  // 무한 스크롤을 위한 Intersection Observer
  const loadMoreRef = useIntersectionObserver(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage]);

  // 포스트 작성 성공 시 피드 새로고침
  const handlePostSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["posts", feedMode] });
  };

  // 피드 모드 변경 시 피드 새로고침
  const handleFeedModeChange = (mode: "for_you" | "following") => {
    setFeedMode(mode);
  };

  // 모든 포스트 플래튼화
  const posts =
    data?.pages.flatMap((page: any) => {
      // 백엔드 응답 구조: { success: true, data: { posts: [...], nextCursor: "..." } }
      return page.data?.posts || page.posts || [];
    }) || [];

  return (
    <div className="max-w-2xl mx-auto">
      {/* 세션 로딩 중 */}
      {sessionLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-border rounded-lg p-4">
              <div className="animate-pulse">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div className="space-y-1">
                    <div className="h-4 bg-muted rounded w-20"></div>
                    <div className="h-3 bg-muted rounded w-16"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
                <div className="flex items-center space-x-8 mt-4">
                  <div className="h-4 bg-muted rounded w-12"></div>
                  <div className="h-4 bg-muted rounded w-12"></div>
                  <div className="h-4 bg-muted rounded w-12"></div>
                  <div className="h-4 bg-muted rounded w-8"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 로그인하지 않은 사용자에게 로그인 유도 */}
      {!sessionLoading && !isAuthenticated && (
        <div className="text-center py-16">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Acorn에 로그인하세요
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              피드를 보려면 로그인이 필요합니다
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/login"
              className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              로그인
            </Link>
            <div className="text-muted-foreground">
              계정이 없으신가요?{" "}
              <Link href="/signup" className="text-primary hover:underline">
                회원가입
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 로그인된 사용자를 위한 피드 */}
      {!sessionLoading && isAuthenticated && (
        <>
          {/* 포스트 작성기 */}
          <div className="mb-6">
            <PostComposer onSuccess={handlePostSuccess} />
          </div>

          {/* 피드 탭 */}
          <div className="border-b border-border mb-6">
            <div className="flex justify-center space-x-8">
              <button
                onClick={() => handleFeedModeChange("for_you")}
                className={cn(
                  "pb-3 px-1 text-sm font-medium border-b-2 transition-colors",
                  feedMode === "for_you"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                )}
              >
                For You
              </button>
              <button
                onClick={() => handleFeedModeChange("following")}
                className={cn(
                  "pb-3 px-1 text-sm font-medium border-b-2 transition-colors",
                  feedMode === "following"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                )}
              >
                Following
              </button>
            </div>
          </div>

          {/* 새로고침 버튼 */}
          <div className="mb-4">
            <Button
              onClick={() => refetch()}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              새로고침
            </Button>
          </div>

          {/* 에러 상태 */}
          {isError && (
            <div className="text-center py-8">
              <div className="text-destructive mb-4">
                <p className="text-lg font-semibold">
                  피드를 불러올 수 없습니다
                </p>
                <p className="text-sm">{error?.message || "알 수 없는 오류"}</p>
              </div>
              <Button onClick={() => refetch()} variant="outline">
                다시 시도
              </Button>
            </div>
          )}

          {/* 로딩 상태 */}
          {isLoading && !isError && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border border-border rounded-lg p-4">
                  <div className="animate-pulse">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-muted rounded-full"></div>
                      <div className="space-y-1">
                        <div className="h-4 bg-muted rounded w-20"></div>
                        <div className="h-3 bg-muted rounded w-16"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                    </div>
                    <div className="flex items-center space-x-8 mt-4">
                      <div className="h-4 bg-muted rounded w-12"></div>
                      <div className="h-4 bg-muted rounded w-12"></div>
                      <div className="h-4 bg-muted rounded w-12"></div>
                      <div className="h-4 bg-muted rounded w-8"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 피드 내용 */}
          {!isLoading && !isError && (
            <>
              <div className="space-y-4">
                {posts.map((post: any) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>

              {/* 무한 스크롤 트리거 */}
              {hasNextPage && (
                <div ref={loadMoreRef} className="py-8 text-center">
                  {isFetchingNextPage ? (
                    <div className="text-muted-foreground">
                      더 불러오는 중...
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      더 많은 게시물 불러오기
                    </div>
                  )}
                </div>
              )}

              {/* 더 이상 로드할 게시물이 없을 때 */}
              {!hasNextPage && posts.length > 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  모든 게시물을 확인했습니다
                </div>
              )}

              {/* 게시물이 없을 때 */}
              {posts.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground mb-4">
                    아직 게시물이 없습니다
                  </p>
                  <p className="text-sm text-muted-foreground">
                    첫 번째 게시물을 작성해보세요!
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
