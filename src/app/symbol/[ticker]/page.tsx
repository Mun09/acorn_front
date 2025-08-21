"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { PostCard } from "@/features/posts/PostCard";
import { Button } from "@/components/ui/Button";
import { TrendingUp, TrendingDown, Activity, ExternalLink } from "lucide-react";
import Link from "next/link";

// 더미 데이터 생성 함수들
function generateSparklineData(days: number = 30): number[] {
  const data: number[] = [];
  let value = 100 + Math.random() * 50; // 시작 가격

  for (let i = 0; i < days; i++) {
    // 약간의 랜덤 변동 (-3% ~ +3%)
    const change = (Math.random() - 0.5) * 0.06;
    value = value * (1 + change);
    data.push(value);
  }

  return data;
}

function generateSentimentData() {
  const bullish = Math.floor(Math.random() * 100);
  const bearish = 100 - bullish;
  return { bullish, bearish };
}

function generateRelatedSymbols(ticker: string): string[] {
  const allSymbols = [
    "AAPL",
    "GOOGL",
    "MSFT",
    "AMZN",
    "TSLA",
    "META",
    "NVDA",
    "NFLX",
    "UBER",
    "SPOT",
  ];
  return allSymbols
    .filter((symbol) => symbol !== ticker)
    .sort(() => Math.random() - 0.5)
    .slice(0, 5);
}

// 스파크라인 컴포넌트
function Sparkline({
  data,
  className = "",
}: {
  data: number[];
  className?: string;
}) {
  if (data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 200; // 200px 너비
      const y = 40 - ((value - min) / range) * 40; // 40px 높이, 뒤집기
      return `${x},${y}`;
    })
    .join(" ");

  const isPositive = data[data.length - 1] > data[0];

  return (
    <svg
      width="200"
      height="40"
      viewBox="0 0 200 40"
      className={`${className} ${isPositive ? "text-green-500" : "text-red-500"}`}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="opacity-80"
      />
    </svg>
  );
}

// 감성 분석 컴포넌트
function SentimentMeter({
  bullish,
  bearish,
}: {
  bullish: number;
  bearish: number;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <Activity className="w-4 h-4" />
        커뮤니티 감성
      </h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-500" />
            강세
          </span>
          <span className="text-sm font-medium text-green-600">{bullish}%</span>
        </div>

        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${bullish}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-red-500" />
            약세
          </span>
          <span className="text-sm font-medium text-red-600">{bearish}%</span>
        </div>
      </div>
    </div>
  );
}

// 연관 심볼 컴포넌트
function RelatedSymbols({ symbols }: { symbols: string[] }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="font-semibold text-foreground mb-3">연관 심볼</h3>
      <div className="space-y-2">
        {symbols.map((symbol) => (
          <Link
            key={symbol}
            href={`/symbol/${symbol}`}
            className="flex items-center justify-between p-2 rounded hover:bg-muted transition-colors"
          >
            <span className="font-medium text-foreground">${symbol}</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </Link>
        ))}
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
  const [sparklineData, setSparklineData] = useState<number[]>([]);
  const [sentiment, setSentiment] = useState({ bullish: 50, bearish: 50 });
  const [relatedSymbols, setRelatedSymbols] = useState<string[]>([]);
  const [symbolExists, setSymbolExists] = useState(true);

  // 더미 데이터 생성
  useEffect(() => {
    if (!ticker) return;

    // 일부 티커만 유효한 것으로 처리 (실제로는 API에서 확인)
    const validTickers = [
      "AAPL",
      "GOOGL",
      "MSFT",
      "AMZN",
      "TSLA",
      "META",
      "NVDA",
      "NFLX",
      "UBER",
      "SPOT",
    ];
    const exists = validTickers.includes(ticker);

    setSymbolExists(exists);

    if (exists) {
      setSparklineData(generateSparklineData());
      setSentiment(generateSentimentData());
      setRelatedSymbols(generateRelatedSymbols(ticker));
    }
  }, [ticker]);

  // 심볼 포스트 데이터 가져오기 (더미 구현)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["symbol-posts", ticker, activeTab],
    queryFn: async ({ pageParam = undefined }) => {
      // 실제로는 API 호출: /symbols/${ticker}/posts?sort=${activeTab}
      // 또는 /search?q=$${ticker}

      // 더미 응답
      await new Promise((resolve) => setTimeout(resolve, 500));

      const dummyPosts = Array.from({ length: 10 }, (_, i) => ({
        id: `${ticker}-${activeTab}-${pageParam || 0}-${i}`,
        content: `${ticker}에 대한 ${activeTab === "hot" ? "인기" : "최신"} 포스트 ${i + 1}. 오늘 ${ticker} 움직임이 흥미롭네요! 📈`,
        createdAt: new Date(
          Date.now() - Math.random() * 24 * 60 * 60 * 1000
        ).toISOString(),
        user: {
          id: i + 1,
          handle: `trader${i + 1}`,
          displayName: `트레이더 ${i + 1}`,
          avatarUrl: null,
          isVerified: Math.random() > 0.7,
        },
        mediaItems: [],
        symbols: [{ ticker, kind: "STOCK" }],
        reactionCounts: {
          likes: Math.floor(Math.random() * 50),
          replies: Math.floor(Math.random() * 20),
          boosts: Math.floor(Math.random() * 10),
          bookmarks: Math.floor(Math.random() * 15),
        },
        userReaction: null,
      }));

      return {
        data: {
          posts: dummyPosts,
          nextCursor: Math.random() > 0.3 ? `cursor-${Date.now()}` : null,
        },
      };
    },
    getNextPageParam: (lastPage: any) => lastPage.data?.nextCursor || undefined,
    initialPageParam: undefined,
    enabled: symbolExists && !!ticker,
  });

  // 모든 포스트 플래튼화
  const posts =
    data?.pages.flatMap((page: any) => page.data?.posts || []) || [];

  if (!ticker) {
    return <SymbolNotFound ticker="UNKNOWN" />;
  }

  if (!symbolExists) {
    return <SymbolNotFound ticker={ticker} />;
  }

  const isPositive =
    sparklineData.length > 0 &&
    sparklineData[sparklineData.length - 1] > sparklineData[0];
  const priceChange =
    sparklineData.length > 0
      ? (
          ((sparklineData[sparklineData.length - 1] - sparklineData[0]) /
            sparklineData[0]) *
          100
        ).toFixed(2)
      : "0";

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
                  ${ticker}
                </h1>
                <p className="text-muted-foreground">NASDAQ • 기술주</p>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`text-lg font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}
                  >
                    {isPositive ? "+" : ""}
                    {priceChange}%
                  </span>
                  <span className="text-sm text-muted-foreground">오늘</span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <div className="mb-2">
                  <Sparkline data={sparklineData} />
                </div>
                <span className="text-xs text-muted-foreground">30일 추이</span>
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
            bullish={sentiment.bullish}
            bearish={sentiment.bearish}
          />
          <RelatedSymbols symbols={relatedSymbols} />
        </div>
      </div>
    </div>
  );
}
