"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, X, AlertCircle, Hash } from "lucide-react";
import { postsApi } from "@/lib/api";
import {
  parseRichText,
  extractCashTags,
  extractMentions,
} from "@/lib/richText";
import { Button } from "@/components/ui/Button";
import { MediaItem } from "@/types";
import { cn } from "@/lib/utils";

// 심볼 추출 함수
function extractSymbols(text: string): string[] {
  const symbolRegex = /\#([A-Z]{1,10})\b/g;
  const symbols: string[] = [];
  let match;

  while ((match = symbolRegex.exec(text)) !== null) {
    const symbol = match[1];
    if (!symbols.includes(symbol)) {
      symbols.push(symbol);
    }
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
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<MediaItem[]>([]);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  // 텍스트에서 심볼 추출
  const extractedSymbols = useMemo(() => extractSymbols(text), [text]);

  // 포스트 생성 뮤테이션
  const createPostMutation = useMutation({
    mutationFn: ({ text, media }: { text: string; media?: MediaItem[] }) => {
      return postsApi.createPost(text, media);
    },
    onSuccess: () => {
      // 성공 시 폼 리셋
      setText("");
      setMediaFiles([]);
      setMediaPreviews([]);
      setError("");

      // 피드 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["posts"] });

      // 성공 콜백 호출
      onSuccess?.();
    },
    onError: (error: any) => {
      setError(error.message || "포스트 작성 중 오류가 발생했습니다");
    },
  });

  // 텍스트 변경 핸들러
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    if (newText.length <= maxLength) {
      setText(newText);
      setError("");

      // 텍스트 영역 높이 자동 조절
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }
  };

  // 파일 선택 핸들러
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);

      if (files.length === 0) return;

      // 최대 4개 파일 제한
      const totalFiles = mediaFiles.length + files.length;
      if (totalFiles > 4) {
        setError("최대 4개의 미디어 파일까지 업로드할 수 있습니다");
        return;
      }

      // 파일 타입 검증
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "video/mp4",
        "video/webm",
      ];
      const invalidFiles = files.filter(
        (file) => !validTypes.includes(file.type)
      );

      if (invalidFiles.length > 0) {
        setError(
          "지원되지 않는 파일 형식입니다. JPEG, PNG, GIF, WebP, MP4, WebM 파일만 업로드 가능합니다"
        );
        return;
      }

      // 파일 크기 검증 (10MB 제한)
      const oversizedFiles = files.filter(
        (file) => file.size > 10 * 1024 * 1024
      );
      if (oversizedFiles.length > 0) {
        setError("파일 크기는 10MB를 초과할 수 없습니다");
        return;
      }

      setMediaFiles((prev) => [...prev, ...files]);

      // 미리보기 생성 (실제 업로드는 스텁으로 파일명만 사용)
      const newPreviews: MediaItem[] = files.map((file) => ({
        url: `stub://${file.name}`, // 실제로는 업로드 후 URL을 받아옴
        type: file.type.startsWith("image/") ? "image" : "video",
      }));

      setMediaPreviews((prev) => [...prev, ...newPreviews]);
      setError("");
    },
    [mediaFiles.length]
  );

  // 미디어 제거 핸들러
  const handleRemoveMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      // 파일 입력 이벤트 시뮬레이션
      const event = {
        target: { files },
      } as any;
      handleFileSelect(event);
    }
  };

  // 제출 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (text.trim().length === 0) {
      setError("포스트 내용을 입력해주세요");
      return;
    }

    if (text.length > maxLength) {
      setError(`포스트는 ${maxLength}자를 초과할 수 없습니다`);
      return;
    }

    // 실제 미디어 업로드 로직은 여기서 구현 (현재는 스텁)
    const mediaForSubmit = mediaPreviews.length > 0 ? mediaPreviews : undefined;

    createPostMutation.mutate({ text: text.trim(), media: mediaForSubmit });
  };

  // 텍스트 파싱 미리보기
  const tokens = parseRichText(text);
  const cashTags = extractCashTags(text);
  const mentions = extractMentions(text);

  const remainingChars = maxLength - text.length;
  const isOverLimit = remainingChars < 0;
  const isNearLimit = remainingChars <= 20;

  return (
    <div className={cn("border border-border rounded-lg p-4", className)}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 텍스트 입력 영역 */}
        <div
          className="relative"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
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

          {/* 드래그 오버레이 */}
          <div className="absolute inset-0 border-2 border-dashed border-transparent pointer-events-none" />
        </div>

        {/* 미디어 미리보기 */}
        {mediaPreviews.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {mediaPreviews.map((media, index) => (
              <div key={index} className="relative group">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border">
                  {media.type === "image" ? (
                    <div className="text-muted-foreground text-sm text-center p-4">
                      🖼️ 이미지 파일
                      <br />
                      {mediaFiles[index]?.name}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm text-center p-4">
                      🎥 비디오 파일
                      <br />
                      {mediaFiles[index]?.name}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveMedia(index)}
                  className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 파싱된 요소 미리보기 */}
        {(cashTags.length > 0 ||
          mentions.length > 0 ||
          extractedSymbols.length > 0) && (
          <div className="text-sm text-muted-foreground space-y-1">
            {cashTags.length > 0 && (
              <div>캐시태그: {cashTags.map((tag) => `$${tag}`).join(", ")}</div>
            )}
            {mentions.length > 0 && (
              <div>
                멘션: {mentions.map((mention) => `@${mention}`).join(", ")}
              </div>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* 미디어 업로드 버튼 */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={mediaPreviews.length >= 4}
              className="p-2 text-muted-foreground hover:text-primary hover:bg-accent rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ImagePlus className="w-5 h-5" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div className="flex items-center space-x-4">
            {/* 글자 수 표시 */}
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

            {/* 제출 버튼 */}
            <Button
              type="submit"
              disabled={
                text.trim().length === 0 ||
                isOverLimit ||
                createPostMutation.isPending
              }
              loading={createPostMutation.isPending}
              size="sm"
            >
              게시
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
