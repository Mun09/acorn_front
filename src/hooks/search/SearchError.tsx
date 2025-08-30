// SearchError.tsx
"use client";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function SearchError({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <div className="text-center py-12">
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
  );
}
