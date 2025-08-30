"use client";

import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function SearchInput({
  value,
  onChange,
  onSubmit,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        placeholder={placeholder}
        className="pl-10 pr-20"
      />
      <Button
        onClick={onSubmit}
        size="sm"
        className="absolute right-2 top-1/2 -translate-y-1/2"
        disabled={!value.trim()}
      >
        검색
      </Button>
    </div>
  );
}
