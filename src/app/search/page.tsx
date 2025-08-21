"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SearchTabs } from "@/features/search/SearchTabs";
import { Search } from "lucide-react";

// SearchParams를 사용하는 컴포넌트를 별도로 분리
function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const type =
    (searchParams.get("type") as "posts" | "people" | "symbols") || "posts";

  return <SearchTabs initialQuery={query} initialType={type} />;
}

// 로딩 컴포넌트
function SearchLoading() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border p-4 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <div className="h-10 bg-muted rounded-md pl-10 animate-pulse" />
        </div>
      </div>
      <div className="p-4">
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
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen">
      {/* 페이지 헤더 */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border p-4 z-20">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold text-foreground flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>검색</span>
          </h1>
        </div>
      </div>

      {/* 검색 콘텐츠 */}
      <Suspense fallback={<SearchLoading />}>
        <SearchContent />
      </Suspense>
    </div>
  );
}
