"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Users, Hash, FileText, AlertCircle } from "lucide-react";
import { searchApi } from "@/lib/api";
import { PostCard } from "@/features/posts/PostCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { SearchUser, SearchSymbol, SearchResponse } from "@/types";

type SearchType = "posts" | "people" | "symbols";

interface SearchTabsProps {
  initialQuery?: string;
  initialType?: SearchType;
}

// 스켈레톤 컴포넌트
function SearchSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="border border-border rounded-lg p-4 animate-pulse"
        >
          <div className="flex space-x-3">
            <div className="w-10 h-10 bg-muted rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 사용자 카드 컴포넌트
function UserCard({ user }: { user: SearchUser }) {
  return (
    <div className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
          <Users className="w-6 h-6 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-foreground">
              {user.displayName}
            </h3>
            {user.isVerified && (
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">@{user.handle}</p>
          {user.bio && (
            <p className="text-sm text-foreground mt-1 line-clamp-2">
              {user.bio}
            </p>
          )}
          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
            <span>{user.followerCount || 0} 팔로워</span>
            <span>{user.followingCount || 0} 팔로잉</span>
          </div>
        </div>
        <Button variant="outline" size="sm">
          팔로우
        </Button>
      </div>
    </div>
  );
}

// 심볼 카드 컴포넌트
function SymbolCard({ symbol }: { symbol: SearchSymbol }) {
  return (
    <div className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
          <Hash className="w-6 h-6 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-foreground">${symbol.ticker}</h3>
            <span className="text-sm bg-muted px-2 py-1 rounded">
              {symbol.kind || "STOCK"}
            </span>
          </div>
          {symbol.name && (
            <p className="text-sm text-muted-foreground">{symbol.name}</p>
          )}
          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
            <span>{symbol.postCount || 0} 포스트</span>
            <span>{symbol.mentionCount || 0} 언급</span>
          </div>
        </div>
        <div className="text-right">
          {symbol.price && (
            <div className="text-sm font-medium">${symbol.price}</div>
          )}
          {symbol.change && (
            <div
              className={cn(
                "text-xs",
                symbol.change > 0 ? "text-green-600" : "text-red-600"
              )}
            >
              {symbol.change > 0 ? "+" : ""}
              {symbol.change}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 빈 결과 컴포넌트
function EmptyResults({ type, query }: { type: SearchType; query: string }) {
  const typeLabels = {
    posts: "포스트",
    people: "사용자",
    symbols: "심볼",
  };

  return (
    <div className="text-center py-12">
      <div className="mb-6">
        <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          "{query}"에 대한 {typeLabels[type]} 검색 결과가 없습니다
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          다른 검색어를 시도하거나 검색 필터를 변경해보세요.
        </p>
      </div>
    </div>
  );
}

// 에러 컴포넌트
function SearchError({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <div className="text-center py-12">
      <div className="mb-6">
        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          검색 중 오류가 발생했습니다
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-4">
          {error.message || "알 수 없는 오류가 발생했습니다."}
        </p>
        <Button onClick={onRetry} variant="outline">
          다시 시도
        </Button>
      </div>
    </div>
  );
}

export function SearchTabs({
  initialQuery = "",
  initialType = "posts",
}: SearchTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<SearchType>(initialType);

  // 검색 실행 함수
  const executeSearch = () => {
    if (query.trim().length > 0) {
      setSearchQuery(query.trim());
    }
  };

  // Enter 키 핸들러
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      executeSearch();
    }
  };

  // URL 업데이트
  useEffect(() => {
    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      params.set("q", searchQuery);
      params.set("type", activeTab);
      router.push(`/search?${params.toString()}`, { scroll: false });
    }
  }, [searchQuery, activeTab, router]);

  // 검색 쿼리
  const { data, isLoading, error, refetch } = useQuery<SearchResponse>({
    queryKey: ["search", searchQuery, activeTab],
    queryFn: () =>
      searchApi.search(searchQuery, activeTab) as Promise<SearchResponse>,
    enabled: searchQuery.trim().length > 0,
    retry: 1,
  });

  const tabs = [
    { key: "posts" as SearchType, label: "포스트", icon: FileText },
    { key: "people" as SearchType, label: "사용자", icon: Users },
    { key: "symbols" as SearchType, label: "심볼", icon: Hash },
  ];

  const handleTabChange = (tab: SearchType) => {
    setActiveTab(tab);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* 검색 입력 */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border p-4 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="검색어를 입력하세요..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-20"
          />
          <Button
            onClick={executeSearch}
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
            disabled={!query.trim()}
          >
            검색
          </Button>
        </div>

        {/* 탭 */}
        {searchQuery.trim().length > 0 && (
          <div className="flex space-x-1 mt-4 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                    activeTab === tab.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 검색 결과 */}
      <div className="p-4">
        {!searchQuery.trim() ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              검색어를 입력해주세요
            </h3>
            <p className="text-muted-foreground">
              포스트, 사용자, 심볼을 검색할 수 있습니다.
            </p>
          </div>
        ) : isLoading ? (
          <SearchSkeleton />
        ) : error ? (
          <SearchError error={error as Error} onRetry={() => refetch()} />
        ) : !data || !data.results || data.results.length === 0 ? (
          <EmptyResults type={activeTab} query={searchQuery} />
        ) : (
          <div className="space-y-4">
            {activeTab === "posts" && (
              <div className="space-y-4">
                {data.results.map((post: any) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}

            {activeTab === "people" && (
              <div className="space-y-4">
                {data.results.map((user: any) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            )}

            {activeTab === "symbols" && (
              <div className="space-y-4">
                {data.results.map((symbol: any) => (
                  <SymbolCard key={symbol.ticker} symbol={symbol} />
                ))}
              </div>
            )}

            {/* 더 많은 결과가 있을 경우 */}
            {data.hasMore && (
              <div className="text-center py-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    /* 페이지네이션 로직 */
                  }}
                >
                  더 보기
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
