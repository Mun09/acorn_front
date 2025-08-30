// PeopleResults.tsx
"use client";

import {
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { UserCard } from "@/components/search/UserCard";

import { searchApi } from "@/lib/api";
import type { SearchUser } from "@/types";
import { SearchSkeleton } from "@/hooks/search/SearchSkeleton";
import { EmptyResults } from "@/hooks/search/EmptyResults";
import { SearchError } from "@/hooks/search/SearchError";
import { useAutoFetchOnIntersect } from "@/hooks/search/useAutoFetchOnIntersect";
import { env } from "@/lib/config";
import {
  SearchedResponse,
  SearchedResponseSchema,
} from "@/types/search/people";

const PAGE_SIZE = env.INFINITE_SCROLL_PAGE_SIZE;

export function PeopleResults({ query }: { query: string }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery<
    SearchedResponse["people"],
    Error,
    InfiniteData<SearchedResponse["people"]>,
    QueryKey, // TQueryKey (Tuple/배열 타입으로 둬도 됨)
    string | undefined
  >({
    queryKey: ["search", "people", query],
    queryFn: async ({ pageParam }) => {
      if (!query.trim()) return { items: [], hasMore: false, nextCursor: null };
      const res = await searchApi.search({
        type: "people",
        query: query.trim(),
        limit: PAGE_SIZE,
        cursor: pageParam,
      });
      const payload = SearchedResponseSchema.parse(res);
      return payload.people;
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

  const users = data?.pages.flatMap((p) => p.items) ?? [];
  if (users.length === 0) return <EmptyResults type="people" query={query} />;

  return (
    <>
      <div className="space-y-4">
        {users.map((u) => (
          <UserCard key={u.id} user={u} />
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
