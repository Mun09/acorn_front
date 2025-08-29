"use client";

import { useState, useRef, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Hash } from "lucide-react";
import { postsApi } from "@/lib/api";
import { extractCashTags, extractMentions } from "@/lib/richText";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

// 심볼 추출 함수 (#SYMBOL)
function extractSymbols(text: string): string[] {
  const symbolRegex = /\#([A-Z]{1,10})\b/g;
  const symbols: string[] = [];
  let match;
  while ((match = symbolRegex.exec(text)) !== null) {
    const symbol = match[1];
    if (!symbols.includes(symbol)) symbols.push(symbol);
  }
  return symbols;
}

interface PostComposerProps {
  className?: string;
  onSuccess?: () => void;
  placeholder?: string;
  maxLength?: number;
}

export function PostComposer({
  className,
  onSuccess,
  placeholder = "무슨 일이 일어나고 있나요?",
  maxLength = 280,
}: PostComposerProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  // 텍스트에서 심볼/태그/멘션 추출
  const extractedSymbols = useMemo(() => extractSymbols(text), [text]);
  const cashTags = extractCashTags(text);
  const mentions = extractMentions(text);

  // 포스트 생성 (텍스트만)
  const createPostMutation = useMutation({
    mutationFn: ({ text }: { text: string }) => postsApi.createPost(text),
    onSuccess: () => {
      setText("");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      onSuccess?.();
    },
    onError: (error: any) => {
      setError(error?.message || "포스트 작성 중 오류가 발생했습니다");
    },
  });

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    if (newText.length <= maxLength) {
      setText(newText);
      setError("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      setError("포스트 내용을 입력해주세요");
      return;
    }
    if (trimmed.length > maxLength) {
      setError(`포스트는 ${maxLength}자를 초과할 수 없습니다`);
      return;
    }
    createPostMutation.mutate({ text: trimmed });
  };

  const remainingChars = maxLength - text.length;
  const isOverLimit = remainingChars < 0;
  const isNearLimit = remainingChars <= 20;

  return (
    <div className={cn("border border-border rounded-lg p-4", className)}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 텍스트 입력 영역 */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            placeholder={placeholder}
            className={cn(
              "w-full min-h-[120px] resize-none border-0 outline-none text-lg placeholder-muted-foreground bg-transparent",
              "focus:ring-0 p-0"
            )}
            style={{ height: "auto" }}
          />
        </div>

        {/* 파싱된 요소 미리보기 */}
        {(cashTags.length > 0 ||
          mentions.length > 0 ||
          extractedSymbols.length > 0) && (
          <div className="text-sm text-muted-foreground space-y-1">
            {cashTags.length > 0 && (
              <div>캐시태그: {cashTags.map((tag) => `$${tag}`).join(", ")}</div>
            )}
            {mentions.length > 0 && (
              <div>멘션: {mentions.map((m) => `@${m}`).join(", ")}</div>
            )}
            {extractedSymbols.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  심볼:
                </span>
                <div className="flex gap-1 flex-wrap">
                  {extractedSymbols.map((symbol) => (
                    <span
                      key={symbol}
                      className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium"
                    >
                      #{symbol}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="flex items-center space-x-2 text-destructive text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* 하단 액션 */}
        <div className="flex items-center justify-end space-x-4">
          <div
            className={cn(
              "text-sm",
              isOverLimit
                ? "text-destructive"
                : isNearLimit
                  ? "text-yellow-500"
                  : "text-muted-foreground"
            )}
          >
            {remainingChars}
          </div>

          <Button
            type="submit"
            disabled={
              !text.trim() || isOverLimit || createPostMutation.isPending
            }
            loading={createPostMutation.isPending}
            size="sm"
          >
            게시
          </Button>
        </div>
      </form>
    </div>
  );
}
