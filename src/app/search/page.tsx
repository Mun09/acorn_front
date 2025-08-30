// app/search/page.tsx (Server Component)
import { Suspense } from "react";
import { Search } from "lucide-react";
import { SearchTabs } from "@/features/search/SearchTabs";

type SearchType = "posts" | "people" | "symbols";

export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string };
}) {
  const initialQuery = (searchParams.q ?? "").toString();

  const allowed: SearchType[] = ["posts", "people", "symbols"];
  const initialType = allowed.includes(searchParams.type as SearchType)
    ? (searchParams.type as SearchType)
    : "posts";

  return (
    <div className="min-h-screen">
      {/* 페이지 헤더 (서버 컴포넌트에서 바로 렌더) */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border p-4 z-20">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Search className="w-5 h-5" />
            <span>검색</span>
          </h1>
        </div>
      </div>

      {/* 검색 탭 (클라이언트 컴포넌트) */}
      <Suspense
        fallback={<div className="max-w-2xl mx-auto p-4">로딩 중…</div>}
      >
        <SearchTabs initialQuery={initialQuery} initialType={initialType} />
      </Suspense>
    </div>
  );
}
