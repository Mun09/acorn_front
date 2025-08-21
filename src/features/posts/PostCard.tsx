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
                    const currentReactions = p.userReactions || [];
                    const currentCounts = p.reactionCounts || {};

                    return {
                      ...p,
                      userReactions: isReacting
                        ? [...currentReactions, type]
                        : currentReactions.filter((r) => r !== type),
                      reactionCounts: {
                        ...currentCounts,
                        [type]: isReacting
                          ? (currentCounts[type] || 0) + 1
                          : Math.max(0, (currentCounts[type] || 0) - 1),
                      },
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
    const isReacting = !post.userReactions?.includes(type);
    reactMutation.mutate({ type, isReacting });
  };

  // 텍스트 파싱
  const tokens = parseRichText(post.text);

  // 미디어 파싱 (JSON string → array)
  const media: MediaItem[] = post.media
    ? typeof post.media === "string"
      ? JSON.parse(post.media)
      : post.media
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
        <Link href={`/users/${post.user.handle}`} className="flex-shrink-0">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-medium">
              {post.user.handle[0].toUpperCase()}
            </span>
          </div>
        </Link>

        {/* 포스트 내용 */}
        <div className="flex-1 min-w-0">
          {/* 헤더 */}
          <div className="flex items-center space-x-2 mb-2">
            <Link
              href={`/users/${post.user.handle}`}
              className="font-semibold text-foreground hover:underline"
            >
              @{post.user.handle}
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
          {media.length > 0 && (
            <div
              className={cn(
                "grid gap-2 mb-3 rounded-lg overflow-hidden",
                getMediaGridClass(media.length)
              )}
            >
              {media.slice(0, 4).map((item, index) => (
                <div
                  key={index}
                  className={cn(
                    "relative bg-muted",
                    media.length === 3 && index === 0 ? "row-span-2" : "",
                    media.length === 3 && index > 0
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
                  {media.length > 4 && index === 3 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-medium">
                        +{media.length - 4}
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
                post.userReactions?.includes("LIKE") && "text-red-500"
              )}
            >
              <div className="p-2 rounded-full group-hover:bg-red-500/10">
                <Heart
                  className={cn(
                    "w-4 h-4",
                    post.userReactions?.includes("LIKE") && "fill-current"
                  )}
                />
              </div>
              <span className="text-sm">{post.reactionCounts?.LIKE || 0}</span>
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
                post.userReactions?.includes("BOOST") && "text-green-500"
              )}
            >
              <div className="p-2 rounded-full group-hover:bg-green-500/10">
                <Repeat className="w-4 h-4" />
              </div>
              <span className="text-sm">{post.reactionCounts?.BOOST || 0}</span>
            </button>

            {/* 북마크 */}
            <button
              onClick={() => handleReaction("BOOKMARK")}
              disabled={reactMutation.isPending}
              className={cn(
                "flex items-center space-x-2 hover:text-blue-500 transition-colors group",
                post.userReactions?.includes("BOOKMARK") && "text-blue-500"
              )}
            >
              <div className="p-2 rounded-full group-hover:bg-blue-500/10">
                <Bookmark
                  className={cn(
                    "w-4 h-4",
                    post.userReactions?.includes("BOOKMARK") && "fill-current"
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
