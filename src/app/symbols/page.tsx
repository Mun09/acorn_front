"use client";

import { useState } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Hash, TrendingUp, Search, Users, Activity } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { symbolsApi } from "@/lib/api";
import { PostCard } from "@/features/posts/PostCard";

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

interface Post {
  id: number;
  userId: number;
  text: string;
  createdAt: string;
  author: {
    id: number;
    handle: string;
    email: string;
  };
  symbols: Array<{
    symbol: {
      id: number;
      ticker: string;
      kind: string;
      exchange: string;
    };
  }>;
  reactionCounts: Record<string, number>;
  _count: {
    reactions: number;
    replies: number;
  };
}

interface SearchResponse {
  symbols: Symbol[];
  nextCursor: string | null;
}

interface FeedResponse {
  posts: Post[];
  nextCursor: string | null;
}

export default function SymbolsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"feed" | "popular" | "search">(
    "feed"
  );

  // 심볼 피드 조회
  const {
    data: feedData,
    fetchNextPage: fetchNextFeedPage,
    hasNextPage: hasNextFeedPage,
    isLoading: feedLoading,
    isFetchingNextPage: isFetchingNextFeedPage,
  } = useInfiniteQuery<FeedResponse>({
    queryKey: ["symbols", "feed"],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.append("sort", "latest");
      params.append("limit", "20");
      if (pageParam) params.append("cursor", pageParam as string);

      const response = await symbolsApi.getSymbolFeed(params.toString());
      return (response as any).data || { posts: [], nextCursor: null };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
    enabled: activeTab === "feed",
  });

  const feedPosts = feedData?.pages.flatMap((page) => page.posts) || [];

  // 인기 심볼 조회
  const {
    data: popularSymbols,
    isLoading: popularLoading,
    error: popularError,
  } = useQuery({
    queryKey: ["symbols", "popular"],
    queryFn: async () => {
      const response = await symbolsApi.getPopularSymbols(50);
      return (response as any).data?.symbols || [];
    },
    enabled: activeTab === "popular",
  });

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
    enabled: activeTab === "search" && !!searchQuery.trim(),
  });

  const searchSymbols = searchData?.pages.flatMap((page) => page.symbols) || [];

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      setActiveTab("search");
    }
  };

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
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="심볼 검색... (예: AAPL, TSLA)"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 탭 */}
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("feed")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "feed"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Activity className="w-4 h-4" />
              심볼 피드
            </button>
            <button
              onClick={() => setActiveTab("popular")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "popular"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              인기 심볼
            </button>
            <button
              onClick={() => setActiveTab("search")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "search"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
              disabled={!searchQuery.trim()}
            >
              <Search className="w-4 h-4" />
              검색 결과
            </button>
          </div>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 심볼 피드 */}
        {activeTab === "feed" && (
          <>
            {feedLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="p-4 bg-card border border-border rounded-lg animate-pulse"
                  >
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-muted rounded-full" />
                      <div className="flex-1">
                        <div className="w-24 h-4 bg-muted rounded mb-2" />
                        <div className="w-full h-16 bg-muted rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : feedPosts.length > 0 ? (
              <>
                <div className="space-y-4">
                  {feedPosts.map((post) => {
                    // PostCard에서 요구하는 형식으로 변환
                    const transformedPost = {
                      ...post,
                      symbols:
                        post.symbols?.map((item) => ({
                          raw: `#${item.symbol.ticker}`,
                          ticker: item.symbol.ticker,
                          kind: item.symbol.kind,
                          exchange: item.symbol.exchange,
                        })) || [],
                      _count: {
                        likes: post.reactionCounts?.LIKE || 0,
                        boosts: post.reactionCounts?.BOOST || 0,
                        bookmarks: post.reactionCounts?.BOOKMARK || 0,
                        replies: post._count?.replies || 0,
                      },
                    };
                    return <PostCard key={post.id} post={transformedPost} />;
                  })}
                </div>
                {hasNextFeedPage && (
                  <div className="text-center mt-6">
                    <button
                      onClick={() => fetchNextFeedPage()}
                      disabled={isFetchingNextFeedPage}
                      className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isFetchingNextFeedPage ? "로딩 중..." : "더 보기"}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  아직 심볼 포스트가 없습니다.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  포스트에 #TICKER를 추가해보세요!
                </p>
              </div>
            )}
          </>
        )}

        {/* 인기 심볼 */}
        {activeTab === "popular" && (
          <>
            {popularLoading ? (
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
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
            ) : popularError ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  심볼을 불러오는데 실패했습니다.
                </p>
              </div>
            ) : popularSymbols?.length > 0 ? (
              <div className="space-y-4">
                {popularSymbols.map(renderSymbolCard)}
              </div>
            ) : (
              <div className="text-center py-8">
                <Hash className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  아직 등록된 심볼이 없습니다.
                </p>
              </div>
            )}
          </>
        )}

        {/* 검색 결과 */}
        {activeTab === "search" && (
          <>
            {!searchQuery.trim() ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">심볼을 검색해보세요.</p>
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
                    <button
                      onClick={() => fetchNextSearchPage()}
                      disabled={isFetchingNextSearchPage}
                      className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isFetchingNextSearchPage ? "로딩 중..." : "더 보기"}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  '{searchQuery}'와 일치하는 심볼이 없습니다.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
