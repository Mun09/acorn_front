"use client";

import { cn } from "@/lib/utils";

export function TabsBar<T extends string>({
  tabs,
  activeKey,
  onChange,
}: {
  tabs: { key: T; label: string }[];
  activeKey: T;
  onChange: (k: T) => void;
}) {
  return (
    <div className="flex space-x-1 mt-4 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
            activeKey === t.key
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
