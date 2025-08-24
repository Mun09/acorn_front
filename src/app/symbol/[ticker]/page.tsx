"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { PostCard } from "@/features/posts/PostCard";
import { Button } from "@/components/ui/Button";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { symbolsApi } from "@/lib/api";

// 감성 분석 컴포넌트
function SentimentMeter({
  sentiment,
  isLoading,
}: {
  sentiment?: {
    bullishPercentage: number;
    bearishPercentage: number;
    confidence: number;
    totalPosts: number;
    totalReactions: number;
  } | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          커뮤니티 감성
        </h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-2 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!sentiment) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          커뮤니티 감성
        </h3>
        <div className="text-center py-6">
          <p className="text-muted-foreground text-sm">
            아직 충분한 데이터가 없습니다
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            포스트와 반응이 더 쌓이면 감성 분석이 표시됩니다
          </p>
        </div>
      </div>
    );
  }

  const {
    bullishPercentage,
    bearishPercentage,
    confidence,
    totalPosts,
    totalReactions,
  } = sentiment;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <Activity className="w-4 h-4" />
        커뮤니티 감성
      </h3>

      <div className="space-y-4">
        {/* 감성 지표 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              강세
            </span>
            <span className="text-sm font-medium text-green-600">
              {bullishPercentage.toFixed(1)}%
            </span>
          </div>

          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${bullishPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-red-500" />
              약세
            </span>
            <span className="text-sm font-medium text-red-600">
              {bearishPercentage.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* 신뢰도와 통계 */}
        <div className="pt-3 border-t border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">신뢰도</span>
            <span className="text-xs font-medium">
              {(confidence * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {totalPosts}개 포스트
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {totalReactions}개 반응
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 404 컴포넌트
function SymbolNotFound({ ticker }: { ticker: string }) {
  return (
    <div className="text-center py-16">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          심볼을 찾을 수 없습니다
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          ${ticker} 심볼이 존재하지 않거나 지원되지 않습니다
        </p>
      </div>

      <div className="space-y-4">
        <Link
          href="/symbols"
          className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          심볼 목록 보기
        </Link>
        <div className="text-muted-foreground">
          또는{" "}
          <Link href="/" className="text-primary hover:underline">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SymbolPage() {
  const params = useParams();
  const ticker = (params.ticker as string)?.toUpperCase();

  const [activeTab, setActiveTab] = useState<"latest" | "hot">("latest");

  // 심볼 정보 조회
  const {
    data: symbolData,
    isLoading: symbolLoading,
    isError: symbolError,
  } = useQuery({
    queryKey: ["symbol", ticker],
    queryFn: () => symbolsApi.getSymbol(ticker!),
    enabled: !!ticker,
  });

  // 감성 분석 데이터 조회
  const { data: sentimentData, isLoading: sentimentLoading } = useQuery({
    queryKey: ["symbol-sentiment", ticker],
    queryFn: () => symbolsApi.getSymbolSentiment(ticker!),
    enabled: !!ticker && !!symbolData,
  });

  // 심볼 포스트 데이터 가져오기
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["posts", ticker, activeTab],
    queryFn: async ({ pageParam = undefined }) => {
      const params = new URLSearchParams({
        sort: activeTab,
        limit: "20",
      });
      if (pageParam) {
        params.append("cursor", pageParam);
      }
      return symbolsApi.getSymbolPosts(ticker!, params.toString());
    },
    getNextPageParam: (lastPage: any) => {
      return lastPage.data?.nextCursor || undefined;
    },
    initialPageParam: undefined,
    enabled: !!ticker && !!symbolData,
  });

  // 모든 포스트 플래튼화
  const posts = useMemo(
    () => data?.pages.flatMap((page: any) => page.data?.posts || []) || [],
    [data]
  );

  // 감성 데이터 메모화
  const processedSentimentData = useMemo(() => {
    return (sentimentData as any)?.data || null;
  }, [sentimentData]);

  if (!ticker) {
    return <SymbolNotFound ticker="UNKNOWN" />;
  }

  if (symbolError) {
    return <SymbolNotFound ticker={ticker} />;
  }

  if (symbolLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded w-32 mb-2"></div>
                <div className="h-4 bg-muted rounded w-48 mb-4"></div>
                <div className="h-6 bg-muted rounded w-24"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 메인 콘텐츠 */}
        <div className="lg:col-span-3 space-y-6">
          {/* 심볼 헤더 */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  ${(symbolData as any)?.data?.symbol?.ticker || ticker}
                </h1>
                <p className="text-muted-foreground">
                  {(symbolData as any)?.data?.symbol?.name ||
                    (symbolData as any)?.data?.symbol?.exchange ||
                    "GLOBAL"}{" "}
                  • {(symbolData as any)?.data?.symbol?.kind || "STOCK"}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {(symbolData as any)?.data?.symbol?._count?.posts && (
                    <span className="text-sm text-muted-foreground">
                      {(symbolData as any).data.symbol._count.posts}개 포스트
                    </span>
                  )}
                  {(symbolData as any)?.data?.symbol?.sector && (
                    <span className="text-sm text-muted-foreground">
                      • {(symbolData as any).data.symbol.sector}
                    </span>
                  )}
                </div>
              </div>

              {/* 감성 요약 */}
              <div className="flex flex-col items-end">
                {processedSentimentData && (
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-muted-foreground">
                        커뮤니티 감성:
                      </span>
                      <span
                        className={`text-lg font-semibold ${
                          processedSentimentData.bullishPercentage >
                          processedSentimentData.bearishPercentage
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {processedSentimentData.bullishPercentage >
                        processedSentimentData.bearishPercentage
                          ? "강세"
                          : "약세"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      신뢰도:{" "}
                      {(processedSentimentData.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="bg-card border border-border rounded-lg">
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab("latest")}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === "latest"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                최신
              </button>
              <button
                onClick={() => setActiveTab("hot")}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === "hot"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                핫
              </button>
            </div>

            {/* 포스트 목록 */}
            <div className="p-6">
              {isLoading && (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="border border-border rounded-lg p-4"
                    >
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
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isError && (
                <div className="text-center py-8">
                  <p className="text-destructive mb-4">
                    포스트를 불러올 수 없습니다
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {error?.message || "알 수 없는 오류"}
                  </p>
                </div>
              )}

              {!isLoading && !isError && (
                <>
                  <div className="space-y-4">
                    {posts.map((post: any) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>

                  {/* 더 불러오기 */}
                  {hasNextPage && (
                    <div className="text-center mt-6">
                      <Button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        variant="outline"
                      >
                        {isFetchingNextPage ? "불러오는 중..." : "더 보기"}
                      </Button>
                    </div>
                  )}

                  {posts.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-lg text-muted-foreground mb-4">
                        ${ticker} 관련 포스트가 없습니다
                      </p>
                      <p className="text-sm text-muted-foreground">
                        첫 번째 포스트를 작성해보세요!
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          <SentimentMeter
            sentiment={processedSentimentData}
            isLoading={sentimentLoading}
          />
        </div>
      </div>
    </div>
  );
}
