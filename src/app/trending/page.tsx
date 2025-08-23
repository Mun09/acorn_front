"use client";

import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { TrendingUp, Hash, Clock, Flame } from "lucide-react";
import { symbolsApi } from "@/lib/api";
import { PostCard } from "@/features/posts/PostCard";

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

interface TrendingResponse {
  posts: Post[];
  nextCursor: string | null;
}

type TrendingType = "hot" | "rising" | "recent";

export default function TrendingPage() {
  const [activeTab, setActiveTab] = useState<TrendingType>("hot");

  // 트렌딩 포스트 조회
  const {
    data: trendingData,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
  } = useInfiniteQuery<TrendingResponse>({
    queryKey: ["trending", activeTab],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.append("sort", activeTab);
      params.append("limit", "20");
      if (pageParam) params.append("cursor", pageParam as string);

      const response = await symbolsApi.getTrendingPosts(params.toString());
      const data = (response as any).data;
      return {
        posts: data?.posts || [],
        nextCursor: data?.nextCursor || null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
    staleTime: 2 * 60 * 1000, // 2분간 fresh 상태 유지
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지 (React Query v5에서는 gcTime 사용)
  });

  const trendingPosts =
    trendingData?.pages.flatMap((page) => page.posts || []) || [];

  const tabs = [
    {
      key: "hot" as TrendingType,
      label: "🔥 핫한 포스트",
      icon: Flame,
      description: "많은 반응을 받은 인기 포스트",
    },
    {
      key: "rising" as TrendingType,
      label: "📈 급상승",
      icon: TrendingUp,
      description: "빠르게 인기를 얻고 있는 포스트",
    },
    {
      key: "recent" as TrendingType,
      label: "⏰ 최신",
      icon: Clock,
      description: "최근에 올라온 심볼 포스트",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Trending</h1>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            심볼과 관련된 가장 핫한 포스트들을 확인해보세요
          </p>

          {/* 탭 */}
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                  title={tab.description}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
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
                    <div className="w-full h-16 bg-muted rounded mb-2" />
                    <div className="flex gap-2">
                      <div className="w-16 h-6 bg-muted rounded" />
                      <div className="w-16 h-6 bg-muted rounded" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : trendingPosts.length > 0 ? (
          <>
            <div className="space-y-4">
              {trendingPosts.map((post, index) => {
                // PostCard에서 요구하는 형식으로 변환
                const transformedPost = {
                  ...post,
                  symbols:
                    post.symbols?.map((item: any) => ({
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

                return (
                  <div key={post.id} className="relative">
                    {/* 트렌딩 순위 표시 (처음 10개만) */}
                    {index < 10 && (
                      <div className="absolute -left-2 top-4 z-10">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index < 3
                              ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {index + 1}
                        </div>
                      </div>
                    )}
                    <div className={index < 10 ? "ml-6" : ""}>
                      <PostCard post={transformedPost} />
                    </div>
                  </div>
                );
              })}
            </div>

            {hasNextPage && (
              <div className="text-center mt-6">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isFetchingNextPage ? "로딩 중..." : "더 보기"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Hash className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              트렌딩 포스트가 없습니다
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              아직 심볼과 관련된 인기 포스트가 없습니다.
              <br />
              포스트에 #TICKER를 추가해서 첫 번째 트렌딩 포스트를 만들어보세요!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
