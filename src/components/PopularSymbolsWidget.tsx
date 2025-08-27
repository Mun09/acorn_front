"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Hash, X } from "lucide-react";
import { useState } from "react";
import { symbolsApi } from "@/lib/api";
import { useSession } from "@/hooks/useSession";

export function PopularSymbolsWidget() {
  const { data: session, isLoading: isSessionLoading } = useSession();
  const [isVisible, setIsVisible] = useState(true);

  // Get popular symbols
  const { data: popularSymbols, isLoading } = useQuery({
    queryKey: ["symbols", "popular"],
    queryFn: async () => {
      const data = await symbolsApi.getPopularSymbols(5);
      return (data as any).data?.symbols || [];
    },
    staleTime: 5 * 60 * 1000, // 5분
    enabled: !!session?.isAuthenticated,
  });

  if (
    !isVisible ||
    !popularSymbols ||
    popularSymbols.length === 0 ||
    !session ||
    isSessionLoading
  ) {
    return null;
  }

  return (
    <div className="hidden lg:block fixed right-0 top-0 h-full w-80 bg-background border-l border-border z-40">
      <div className="flex items-center justify-between p-6 border-b border-border mt-16">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Hash className="w-5 h-5" />
          인기 심볼
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="p-2 rounded-md hover:bg-accent transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      <div className="p-6 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-5 bg-muted rounded w-16"></div>
                    <div className="h-4 bg-muted rounded w-12"></div>
                  </div>
                  <div className="h-4 bg-muted rounded w-8"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {popularSymbols.slice(0, 5).map((symbol: any) => (
              <Link
                key={symbol.id}
                href={`/symbol/${symbol.ticker}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors">
                    ${symbol.ticker}
                  </span>
                  <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {symbol.kind}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground font-medium">
                  {symbol._count?.posts || 0} posts
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
