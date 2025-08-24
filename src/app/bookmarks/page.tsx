"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { postsApi } from "@/lib/api";
import { PostCard } from "@/features/posts/PostCard";
import { Post } from "@/types";
import { Bookmark } from "lucide-react";

export default function BookmarksPage() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ["posts", "bookmarks"],
    queryFn: ({ pageParam }) =>
      postsApi.getBookmarkedPosts({ cursor: pageParam }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.data.nextCursor,
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 30, // 30분
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border p-4 z-10">
          <div className="flex items-center space-x-3">
            <Bookmark className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-bold">북마크</h1>
          </div>
        </div>
        <div className="p-8 text-center text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">북마크를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border p-4 z-10">
          <div className="flex items-center space-x-3">
            <Bookmark className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-bold">북마크</h1>
          </div>
        </div>
        <div className="p-8 text-center text-muted-foreground">
          <p>북마크를 불러오는 중 오류가 발생했습니다.</p>
        </div>
      </div>
    );
  }

  const posts = data?.pages.flatMap((page) => page.data.posts) || [];

  return (
    <div className="max-w-2xl mx-auto">
      {/* 헤더 */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border p-4 z-10">
        <div className="flex items-center space-x-3">
          <Bookmark className="w-6 h-6 text-blue-500" />
          <h1 className="text-xl font-bold">북마크</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          저장한 포스트들을 확인하세요
        </p>
      </div>

      {/* 포스트 목록 */}
      <div className="divide-y divide-border">
        {posts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bookmark className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">
              아직 북마크한 포스트가 없습니다
            </h3>
            <p className="text-sm">
              마음에 드는 포스트를 북마크하여 나중에 다시 볼 수 있습니다.
            </p>
          </div>
        ) : (
          <>
            {posts.map((post: Post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {/* 더 보기 버튼 */}
            {hasNextPage && (
              <div className="p-4 text-center">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isFetchingNextPage ? "로딩 중..." : "더 보기"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
