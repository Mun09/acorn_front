// EmptyResults.tsx
"use client";
import { Search } from "lucide-react";

export function EmptyResults({
  type,
  query,
}: {
  type: "posts" | "people" | "symbols";
  query: string;
}) {
  const label = { posts: "포스트", people: "사용자", symbols: "심볼" }[type];
  return (
    <div className="text-center py-12">
      <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">
        "{query}"에 대한 {label} 검색 결과가 없습니다
      </h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        다른 검색어를 시도하거나 검색 필터를 변경해보세요.
      </p>
    </div>
  );
}
