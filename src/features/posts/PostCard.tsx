"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Heart,
  MessageCircle,
  Repeat,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postsApi } from "@/lib/api";
import { parseRichText } from "@/lib/richText";
import { Post, MediaItem } from "@/types";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: Post;
  className?: string;
}

export function PostCard({ post, className }: PostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const queryClient = useQueryClient();

  // 백엔드 응답 구조에 맞게 데이터 변환
  const postMedia = post.media || [];
  const postText = post.text || ""; // 백엔드에서 text로 반환
  const symbols = post.symbols || [];

  // author를 user로 매핑 (PostCard 컴포넌트가 user를 기대함)
  const user = post.user || {
    id: post.author?.id || 0,
    handle: post.author?.handle || "",
    displayName: post.author?.handle || "",
    email: "",
  };

  // 백엔드 reactionCounts를 _count 형태로 변환
  const reactionCounts = post.reactionCounts || {};
  const _count = {
    likes: reactionCounts.LIKE || 0,
    boosts: reactionCounts.BOOST || 0,
    bookmarks: reactionCounts.BOOKMARK || 0,
    replies: 0, // replies는 별도 처리 필요
  };

  // 현재는 사용자별 반응 상태를 알 수 없으므로 기본값
  const userReactions: string[] = [];

  // 리액션 뮤테이션 (낙관적 업데이트 포함)
  const reactMutation = useMutation({
    mutationFn: ({
      type,
      isReacting,
    }: {
      type: "LIKE" | "BOOKMARK" | "BOOST";
      isReacting: boolean;
    }) => {
      return isReacting
        ? postsApi.reactToPost(post.id, type)
        : postsApi.unreactToPost(post.id, type);
    },
    onMutate: async ({ type, isReacting }) => {
      // 현재 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      // 이전 데이터 백업
      const previousData = queryClient.getQueryData(["posts", "for_you"]);
      const previousFollowingData = queryClient.getQueryData([
        "posts",
        "following",
      ]);

      // 낙관적 업데이트 수행
      const updatePostReaction = (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            data: {
              ...page.data,
              posts:
                page.data?.posts?.map((p: Post) => {
                  if (p.id === post.id) {
                    // 백엔드 응답 구조에서는 낙관적 업데이트를 단순화
                    // reactionCounts를 직접 업데이트
                    const updatedReactionCounts = { ...p.reactionCounts };

                    if (type === "LIKE") {
                      updatedReactionCounts.LIKE = isReacting
                        ? (updatedReactionCounts.LIKE || 0) + 1
                        : Math.max(0, (updatedReactionCounts.LIKE || 0) - 1);
                    } else if (type === "BOOST") {
                      updatedReactionCounts.BOOST = isReacting
                        ? (updatedReactionCounts.BOOST || 0) + 1
                        : Math.max(0, (updatedReactionCounts.BOOST || 0) - 1);
                    } else if (type === "BOOKMARK") {
                      updatedReactionCounts.BOOKMARK = isReacting
                        ? (updatedReactionCounts.BOOKMARK || 0) + 1
                        : Math.max(
                            0,
                            (updatedReactionCounts.BOOKMARK || 0) - 1
                          );
                    }

                    return {
                      ...p,
                      reactionCounts: updatedReactionCounts,
                    };
                  }
                  return p;
                }) || [],
            },
          })),
        };
      };

      // For You 피드 업데이트
      queryClient.setQueryData(["posts", "for_you"], updatePostReaction);

      // Following 피드 업데이트
      queryClient.setQueryData(["posts", "following"], updatePostReaction);

      return { previousData, previousFollowingData };
    },
    onError: (err, variables, context) => {
      // 에러 시 이전 데이터로 롤백
      if (context?.previousData) {
        queryClient.setQueryData(["posts", "for_you"], context.previousData);
      }
      if (context?.previousFollowingData) {
        queryClient.setQueryData(
          ["posts", "following"],
          context.previousFollowingData
        );
      }
    },
    onSettled: () => {
      // 성공/실패 상관없이 백그라운드에서 새로고침
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const handleReaction = (type: "LIKE" | "BOOKMARK" | "BOOST") => {
    const isReacting = !userReactions?.includes(type);
    reactMutation.mutate({ type, isReacting });
  };

  // 텍스트 파싱
  const tokens = parseRichText(postText);

  // 미디어 파싱 (JSON string → array)
  const mediaItems: MediaItem[] = postMedia
    ? typeof postMedia === "string"
      ? JSON.parse(postMedia)
      : postMedia
    : [];

  // 텍스트 렌더링
  const renderText = () => {
    return tokens.map((token, index) => {
      if (token.type === "hashtag") {
        return (
          <Link
            key={index}
            href={`/symbols/${token.symbol}`}
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            {token.content}
          </Link>
        );
      } else if (token.type === "mention") {
        return (
          <Link
            key={index}
            href={`/users/${token.handle}`}
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            {token.content}
          </Link>
        );
      } else if (token.type === "symbol") {
        return (
          <Link
            key={index}
            href={`/symbol/${token.ticker}`}
            className="text-primary hover:text-primary/80 font-medium"
          >
            {token.content}
          </Link>
        );
      } else {
        return <span key={index}>{token.content}</span>;
      }
    });
  };

  // 미디어 그리드 클래스
  const getMediaGridClass = (count: number) => {
    switch (count) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-2";
      case 4:
        return "grid-cols-2";
      default:
        return "grid-cols-1";
    }
  };

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ko,
    });
  };

  return (
    <article
      className={cn(
        "border-b border-border p-4 hover:bg-accent/50 transition-colors",
        className
      )}
    >
      <div className="flex space-x-3">
        {/* 사용자 아바타 */}
        <Link href={`/users/${user.handle}`} className="flex-shrink-0">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-medium">
              {user.handle[0].toUpperCase()}
            </span>
          </div>
        </Link>

        {/* 포스트 내용 */}
        <div className="flex-1 min-w-0">
          {/* 헤더 */}
          <div className="flex items-center space-x-2 mb-2">
            <Link
              href={`/users/${user.handle}`}
              className="font-semibold text-foreground hover:underline"
            >
              @{user.handle}
            </Link>
            <span className="text-muted-foreground text-sm">·</span>
            <time
              className="text-muted-foreground text-sm"
              dateTime={post.createdAt}
            >
              {formatTime(post.createdAt)}
            </time>
            <div className="ml-auto">
              <button className="text-muted-foreground hover:text-foreground p-1">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 텍스트 내용 */}
          <div className="text-foreground mb-3 whitespace-pre-wrap break-words">
            {renderText()}
          </div>

          {/* 미디어 */}
          {mediaItems.length > 0 && (
            <div
              className={cn(
                "grid gap-2 mb-3 rounded-lg overflow-hidden",
                getMediaGridClass(mediaItems.length)
              )}
            >
              {mediaItems.slice(0, 4).map((item: MediaItem, index: number) => (
                <div
                  key={index}
                  className={cn(
                    "relative bg-muted",
                    mediaItems.length === 3 && index === 0 ? "row-span-2" : "",
                    mediaItems.length === 3 && index > 0
                      ? "aspect-square"
                      : "aspect-video"
                  )}
                >
                  {item.type === "image" ? (
                    <img
                      src={item.url}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <video
                      src={item.url}
                      controls
                      className="w-full h-full object-cover"
                      preload="metadata"
                    />
                  )}
                  {mediaItems.length > 4 && index === 3 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-medium">
                        +{mediaItems.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 리액션 버튼들 */}
          <div className="flex items-center space-x-8 text-muted-foreground">
            {/* 좋아요 */}
            <button
              onClick={() => handleReaction("LIKE")}
              disabled={reactMutation.isPending}
              className={cn(
                "flex items-center space-x-2 hover:text-red-500 transition-colors group",
                userReactions?.includes("LIKE") && "text-red-500"
              )}
            >
              <div className="p-2 rounded-full group-hover:bg-red-500/10">
                <Heart
                  className={cn(
                    "w-4 h-4",
                    userReactions?.includes("LIKE") && "fill-current"
                  )}
                />
              </div>
              <span className="text-sm">{reactionCounts?.LIKE || 0}</span>
            </button>

            {/* 댓글 */}
            <Link
              href={`/posts/${post.id}`}
              className="flex items-center space-x-2 hover:text-blue-500 transition-colors group"
            >
              <div className="p-2 rounded-full group-hover:bg-blue-500/10">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="text-sm">{post._count?.replies || 0}</span>
            </Link>

            {/* 부스트 */}
            <button
              onClick={() => handleReaction("BOOST")}
              disabled={reactMutation.isPending}
              className={cn(
                "flex items-center space-x-2 hover:text-green-500 transition-colors group",
                userReactions?.includes("BOOST") && "text-green-500"
              )}
            >
              <div className="p-2 rounded-full group-hover:bg-green-500/10">
                <Repeat className="w-4 h-4" />
              </div>
              <span className="text-sm">{reactionCounts?.BOOST || 0}</span>
            </button>

            {/* 북마크 */}
            <button
              onClick={() => handleReaction("BOOKMARK")}
              disabled={reactMutation.isPending}
              className={cn(
                "flex items-center space-x-2 hover:text-blue-500 transition-colors group",
                userReactions?.includes("BOOKMARK") && "text-blue-500"
              )}
            >
              <div className="p-2 rounded-full group-hover:bg-blue-500/10">
                <Bookmark
                  className={cn(
                    "w-4 h-4",
                    userReactions?.includes("BOOKMARK") && "fill-current"
                  )}
                />
              </div>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
