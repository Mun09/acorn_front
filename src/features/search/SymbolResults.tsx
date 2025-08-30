// SymbolsResults.tsx
"use client";

import {
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { symbolsApi } from "@/lib/api";
import { SymbolCard } from "@/components/search/SymbolCard";
import { EmptyResults } from "@/hooks/search/EmptyResults";
import { SearchError } from "@/hooks/search/SearchError";
import { SearchSkeleton } from "@/hooks/search/SearchSkeleton";
import { useAutoFetchOnIntersect } from "@/hooks/search/useAutoFetchOnIntersect";
import {
  SearchSymbolsPage,
  SearchSymbolsPageSchema,
} from "@/types/search/symbol";
import { env } from "@/lib/config";

const PAGE_SIZE = env.INFINITE_SCROLL_PAGE_SIZE;

export function SymbolsResults({ query }: { query: string }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery<
    SearchSymbolsPage, // TQueryFnData: queryFn이 반환하는 "각 페이지"의 타입
    Error, // TError
    InfiniteData<SearchSymbolsPage>, // TData (select 안 쓸 거면 동일)
    QueryKey, // TQueryKey (Tuple/배열 타입으로 둬도 됨)
    string | undefined
  >({
    queryKey: ["search", "symbols", query],
    queryFn: async ({ pageParam }) => {
      if (!query.trim()) return { symbols: [], nextCursor: null };

      const res = await symbolsApi.searchSymbols({
        query: query.trim(),
        limit: PAGE_SIZE,
        cursor: pageParam,
      });

      const payload = res.data;
      return SearchSymbolsPageSchema.parse(payload);
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

  const symbols =
    data?.pages.flatMap((p) =>
      p.symbols.map((s) => ({
        id: s.id,
        ticker: s.ticker,
        kind: s.kind,
        exchange: s.exchange,
        name: s.name,
        postsCount: s._count?.posts ?? 0,
      }))
    ) ?? [];

  if (symbols.length === 0)
    return <EmptyResults type="symbols" query={query} />;

  return (
    <>
      <div className="space-y-4">
        {symbols.map((s) => (
          <SymbolCard key={s.id} symbol={s} />
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
