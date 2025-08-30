// SymbolCard.tsx
"use client";

import { Hash } from "lucide-react";

export function SymbolCard({
  symbol,
}: {
  symbol: {
    id: number;
    ticker: string;
    kind: string;
    exchange: string;
    name?: string;
    postsCount: number;
  };
}) {
  return (
    <div className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
          <Hash className="w-6 h-6 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">${symbol.ticker}</h3>
            <span className="text-xs bg-muted px-2 py-1 rounded">
              {symbol.kind} • {symbol.exchange}
            </span>
          </div>
          {symbol.name && (
            <p className="text-sm text-muted-foreground">{symbol.name}</p>
          )}
          <div className="text-xs text-muted-foreground mt-1">
            {symbol.postsCount} posts
          </div>
        </div>
      </div>
    </div>
  );
}
