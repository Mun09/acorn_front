// PostsResults.tsx
"use client";

import {
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { PostCard } from "@/features/posts/PostCard";
import { searchApi } from "@/lib/api";
import { SearchSkeleton } from "@/hooks/search/SearchSkeleton";
import { EmptyResults } from "@/hooks/search/EmptyResults";
import { SearchError } from "@/hooks/search/SearchError";
import { useAutoFetchOnIntersect } from "@/hooks/search/useAutoFetchOnIntersect";
import {
  SearchedPost,
  SearchedResponse,
  SearchedResponseSchema,
} from "@/types/search/posts";
import { env } from "@/lib/config";

const PAGE_SIZE = env.INFINITE_SCROLL_PAGE_SIZE;

export function PostsResults({ query }: { query: string }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery<
    SearchedResponse["posts"],
    Error,
    InfiniteData<SearchedResponse["posts"]>,
    QueryKey, // TQueryKey (Tuple/배열 타입으로 둬도 됨)
    string | undefined
  >({
    queryKey: ["search", "posts", query],
    queryFn: async ({ pageParam }) => {
      if (!query.trim()) return { items: [], hasMore: false, nextCursor: null };
      const res = await searchApi.search({
        type: "posts",
        query: query.trim(),
        limit: PAGE_SIZE,
        cursor: pageParam,
      });
      const payload = SearchedResponseSchema.parse(res);
      return payload.posts;
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: undefined,
    enabled: !!query.trim(),
  });

  const bottomRef = useAutoFetchOnIntersect<HTMLDivElement>(
    !!hasNextPage && !isFetchingNextPage,
    () => fetchNextPage(),
    [hasNextPage, isFetchingNextPage]
  );

  if (!query.trim()) return null;
  if (isLoading) return <SearchSkeleton />;
  if (error)
    return <SearchError error={error as Error} onRetry={() => refetch()} />;

  const posts = data?.pages.flatMap((p) => p.items) ?? [];
  if (posts.length === 0) return <EmptyResults type="posts" query={query} />;

  return (
    <>
      <div className="space-y-4">
        {posts.map((post: SearchedPost) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      <div ref={bottomRef} />
      {hasNextPage && (
        <div className="text-center py-4">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "로딩 중..." : "더 보기"}
          </Button>
        </div>
      )}
    </>
  );
}
