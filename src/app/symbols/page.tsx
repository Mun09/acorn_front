"use client";

import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Hash, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { symbolsApi } from "@/lib/api";

interface Symbol {
  id: number;
  ticker: string;
  kind: string;
  exchange: string;
  name?: string;
  description?: string;
  _count: {
    posts: number;
  };
}

interface SearchResponse {
  symbols: Symbol[];
  nextCursor: string | null;
}

export default function SymbolsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // 검색 실행 함수
  const executeSearch = () => {
    if (searchInput.trim().length >= 1) {
      setSearchQuery(searchInput.trim());
    }
  };

  // Enter 키 핸들러
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      executeSearch();
    }
  };

  // 심볼 검색
  const {
    data: searchData,
    fetchNextPage: fetchNextSearchPage,
    hasNextPage: hasNextSearchPage,
    isLoading: searchLoading,
    isFetchingNextPage: isFetchingNextSearchPage,
  } = useInfiniteQuery<SearchResponse>({
    queryKey: ["symbols", "search", searchQuery],
    queryFn: async ({ pageParam }) => {
      if (!searchQuery.trim()) return { symbols: [], nextCursor: null };

      const response = await symbolsApi.searchSymbols({
        query: searchQuery.trim(),
        limit: 20,
        cursor: pageParam as string,
      });
      return (response as any).data || { symbols: [], nextCursor: null };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
    enabled: !!searchQuery.trim(),
  });

  const searchSymbols = searchData?.pages.flatMap((page) => page.symbols) || [];

  const renderSymbolCard = (symbol: Symbol) => (
    <Link
      key={symbol.id}
      href={`/symbol/${symbol.ticker}`}
      className="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Hash className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">${symbol.ticker}</h3>
            <p className="text-sm text-muted-foreground">
              {symbol.kind} • {symbol.exchange}
            </p>
            {symbol.name && (
              <p className="text-xs text-muted-foreground mt-1">
                {symbol.name}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{symbol._count.posts}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">posts</p>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Hash className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Symbols</h1>
          </div>

          {/* 검색 입력 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="심볼 검색... (예: AAPL, TSLA)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 pr-20"
            />
            <Button
              onClick={executeSearch}
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              disabled={!searchInput.trim()}
            >
              검색
            </Button>
          </div>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {!searchQuery.trim() ? (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">심볼을 검색해보세요.</p>
            <p className="text-sm text-muted-foreground mt-2">
              AAPL, TSLA, GOOGL 등의 심볼을 검색할 수 있습니다.
            </p>
          </div>
        ) : searchLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="p-4 bg-card border border-border rounded-lg animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-lg" />
                    <div>
                      <div className="w-16 h-4 bg-muted rounded mb-2" />
                      <div className="w-24 h-3 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="w-8 h-4 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : searchSymbols.length > 0 ? (
          <>
            <div className="space-y-4">
              {searchSymbols.map(renderSymbolCard)}
            </div>
            {hasNextSearchPage && (
              <div className="text-center mt-6">
                <Button
                  onClick={() => fetchNextSearchPage()}
                  disabled={isFetchingNextSearchPage}
                  variant="outline"
                >
                  {isFetchingNextSearchPage ? "로딩 중..." : "더 보기"}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              '{searchQuery}'와 일치하는 심볼이 없습니다.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              다른 검색어를 시도해보세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
