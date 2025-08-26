// UserPostsList.tsx
"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { PostCard } from "@/features/posts/PostCard";

export function UserPostsList({ handle }: { handle: string }) {
  const {
    data: pages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["user-posts", handle],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      return usersApi.getUserPosts(handle, {
        cursor: pageParam,
        limit: 20,
      });
    },
    getNextPageParam: (lastPage: any) =>
      lastPage?.nextCursor ?? lastPage?.data?.nextCursor ?? null,
    enabled: !!handle,
  });

  const posts = useMemo(() => {
    if (!pages) return [];
    return pages.pages.flatMap((p: any) => p.posts ?? p.data?.posts ?? []);
  }, [pages]);

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">내 포스트</h2>

      {isLoading ? (
        <div className="text-muted-foreground">로딩 중...</div>
      ) : isError ? (
        <div className="text-muted-foreground">
          포스트를 불러오지 못했습니다.
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          작성한 포스트가 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))}

          {hasNextPage && (
            <div className="text-center mt-4">
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "로딩 중..." : "더 보기"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
