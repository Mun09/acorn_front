"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { SearchInput } from "./SearchInput";
import { TabsBar } from "./TabsBar";
import { PostsResults } from "./PostResults";
import { PeopleResults } from "./PeopleResults";
import { SymbolsResults } from "./SymbolResults";

type SearchType = "posts" | "people" | "symbols";

export function SearchTabs({
  initialQuery = "",
  initialType = "posts",
}: {
  initialQuery?: string;
  initialType?: SearchType;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<SearchType>(initialType);

  const tabs = useMemo(
    () => [
      { key: "posts" as const, label: "포스트" },
      { key: "people" as const, label: "사용자" },
      { key: "symbols" as const, label: "심볼" },
    ],
    []
  );

  const executeSearch = () => {
    if (query.trim()) setSearchQuery(query.trim());
  };

  useEffect(() => {
    if (!searchQuery.trim()) return;
    const params = new URLSearchParams();
    params.set("q", searchQuery);
    params.set("type", activeTab);
    router.push(`/search?${params.toString()}`, { scroll: false });
  }, [searchQuery, activeTab, router]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border p-4 z-10">
        <SearchInput
          value={query}
          onChange={setQuery}
          onSubmit={executeSearch}
          placeholder="검색어를 입력하세요..."
        />
        {searchQuery.trim() && (
          <TabsBar
            tabs={tabs}
            activeKey={activeTab}
            onChange={(k) => setActiveTab(k as SearchType)}
          />
        )}
      </div>

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
        ) : activeTab === "posts" ? (
          <PostsResults query={searchQuery} />
        ) : activeTab === "people" ? (
          <PeopleResults query={searchQuery} />
        ) : (
          <SymbolsResults query={searchQuery} />
        )}
      </div>
    </div>
  );
}
