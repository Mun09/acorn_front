"use client";

import React, { useMemo, useState, useEffect } from "react";
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
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { postsApi, symbolsApi } from "@/lib/api";
import { parseRichText } from "@/lib/richText";
import { Post, MediaItem } from "@/types";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/useSession";
import { useUserReactions } from "@/hooks/useUserReactions";

interface PostCardProps {
  post: Post;
  className?: string;
}

// Helper function to update a single post inside caches
function updatePostInCaches(
  qc: ReturnType<typeof useQueryClient>,
  postId: number,
  updater: (p: Post) => Post
) {
  qc.setQueryData(["post", postId], (old: Post | undefined) =>
    old ? updater(old) : old
  );
  qc.setQueryData(["feed"], (old: any) => {
    if (!old) return old;
    if (Array.isArray(old)) {
      return old.map((p: Post) => (p.id === postId ? updater(p) : p));
    }
    if (Array.isArray(old.items)) {
      return {
        ...old,
        items: old.items.map((p: Post) => (p.id === postId ? updater(p) : p)),
      };
    }
    return old;
  });
}

export const PostCard = React.memo(
  function PostCard({ post, className }: PostCardProps) {
    const queryClient = useQueryClient();
    const { data: session } = useSession();

    // useUserReactions를 조건부로만 호출 (userReactions이 없을 때만)
    const shouldLoadUserReactions =
      session?.isAuthenticated &&
      (!post.userReactions || post.userReactions.length === 0);
    const { getUserReactionsForPost, invalidateUserReactions } =
      useUserReactions();

    // 로컬 상태로 reaction 상태 및 카운트 관리 (더 빠른 UI 업데이트를 위해)
    const [localUserReactions, setLocalUserReactions] = useState<string[]>([]);
    const [localReactionCounts, setLocalReactionCounts] = useState<
      Record<string, number>
    >({});

    // userReactions을 백엔드 데이터 또는 캐시된 데이터로 결정
    const finalUserReactions = useMemo(() => {
      if (post.userReactions && post.userReactions.length > 0) {
        return post.userReactions;
      }
      // 백엔드에서 userReactions이 없는 경우에만 캐시된 데이터 사용
      return shouldLoadUserReactions ? getUserReactionsForPost(post.id) : [];
    }, [
      post.userReactions,
      post.id,
      shouldLoadUserReactions,
      getUserReactionsForPost,
    ]);

    // 백엔드에서 받은 데이터를 직접 사용 (메모이제이션)
    const serverReactionCounts = useMemo(
      () => post.reactionCounts || {},
      [post.reactionCounts]
    );

    // 초기 로컬 상태 설정
    useEffect(() => {
      setLocalUserReactions(finalUserReactions);
      setLocalReactionCounts(serverReactionCounts);
    }, [finalUserReactions, serverReactionCounts]);

    // 실제 사용할 user reactions 및 counts (로컬 상태 우선)
    const currentUserReactions =
      localUserReactions.length > 0 ? localUserReactions : finalUserReactions;
    const currentReactionCounts =
      Object.keys(localReactionCounts).length > 0
        ? localReactionCounts
        : serverReactionCounts;

    // 백엔드 응답 구조에 맞게 데이터 변환 (메모이제이션)
    const postMedia = useMemo(() => post.media || [], [post.media]);
    const postText = useMemo(() => post.text || "", [post.text]);
    const symbols = useMemo(() => post.symbols || [], [post.symbols]);

    // author를 user로 매핑 (메모이제이션)
    const user = useMemo(
      () =>
        post.user || {
          id: post.author?.id || 0,
          handle: post.author?.handle || "",
          displayName: post.author?.handle || "",
          email: "",
        },
      [post.user, post.author]
    );

    // 백엔드에서 받은 데이터를 직접 사용 (메모이제이션)
    const reactionCounts = currentReactionCounts;

    // 사용자의 리액션 상태 체크 (메모이제이션)
    const hasUserReacted = useMemo(
      () => ({
        LIKE: currentUserReactions.includes("LIKE"),
        BOOKMARK: currentUserReactions.includes("BOOKMARK"),
        BOOST: currentUserReactions.includes("BOOST"),
      }),
      [currentUserReactions]
    );

    // 리액션 뮤테이션 (정확한 낙관적 업데이트)
    const reactMutation = useMutation<
      {
        success: boolean;
        data: {
          action: "added" | "removed";
          type: "LIKE" | "BOOKMARK" | "BOOST";
          reactionCounts: Record<string, number>;
        };
      },
      Error,
      { type: "LIKE" | "BOOKMARK" | "BOOST" },
      { prevDetail?: Post; prevFeed?: any }
    >({
      mutationFn: ({ type }: { type: "LIKE" | "BOOKMARK" | "BOOST" }) =>
        postsApi.reactToPost(post.id, type) as Promise<{
          success: boolean;
          data: {
            action: "added" | "removed";
            type: "LIKE" | "BOOKMARK" | "BOOST";
            reactionCounts: Record<string, number>;
          };
        }>,

      onMutate: async ({ type }) => {
        await queryClient.cancelQueries({ queryKey: ["post", post.id] });
        await queryClient.cancelQueries({ queryKey: ["feed"] });

        const prevDetail = queryClient.getQueryData<Post>(["post", post.id]);
        const prevFeed = queryClient.getQueryData(["feed"]);

        const optimistic = (p: Post): Post => {
          const prevUserReactions = p.userReactions ?? [];
          const had = prevUserReactions.includes(type);
          const nextUserReactions = had
            ? prevUserReactions.filter((r) => r !== type)
            : [...prevUserReactions, type];

          const prevCounts = p.reactionCounts ?? {};
          const nextCounts = {
            ...prevCounts,
            [type]: Math.max(0, (prevCounts[type] || 0) + (had ? -1 : +1)),
          };

          return {
            ...p,
            userReactions: nextUserReactions,
            reactionCounts: nextCounts,
          };
        };

        updatePostInCaches(queryClient, post.id, optimistic);

        // keep local state in sync immediately
        setLocalUserReactions((prev) => {
          const had = prev.includes(type);
          return had ? prev.filter((r) => r !== type) : [...prev, type];
        });
        setLocalReactionCounts((prev) => {
          const next = { ...prev };
          const had = currentUserReactions.includes(type);
          next[type] = Math.max(0, (next[type] || 0) + (had ? -1 : +1));
          return next;
        });

        return { prevDetail, prevFeed };
      },

      onError: (_err, _vars, ctx) => {
        if (ctx?.prevDetail)
          queryClient.setQueryData(["post", post.id], ctx.prevDetail);
        if (ctx?.prevFeed) queryClient.setQueryData(["feed"], ctx.prevFeed);
        // restore local state from server-backed values
        setLocalUserReactions(finalUserReactions);
        setLocalReactionCounts(serverReactionCounts);
        console.error("Failed to react to post:", _err);
      },

      onSuccess: (response: {
        success: boolean;
        data: {
          action: "added" | "removed";
          type: "LIKE" | "BOOKMARK" | "BOOST";
          reactionCounts: Record<string, number>;
        };
      }) => {
        // 서버 응답에서 실제 데이터 추출
        const {
          action,
          type,
          reactionCounts: serverReactionCounts,
        } = response.data;

        // 현재 사용자의 리액션 상태를 서버 응답으로부터 계산
        const currentServerUserReactions = [...localUserReactions];
        if (action === "added" && !currentServerUserReactions.includes(type)) {
          currentServerUserReactions.push(type);
        } else if (action === "removed") {
          const index = currentServerUserReactions.indexOf(type);
          if (index > -1) {
            currentServerUserReactions.splice(index, 1);
          }
        }

        console.log("Server response:", action, type, serverReactionCounts);
        console.log(
          "Local reactions:",
          localUserReactions,
          localReactionCounts
        );

        // 서버 응답이 현재 로컬 상태와 다른 경우에만 업데이트
        const needsUserReactionsUpdate =
          JSON.stringify(localUserReactions.sort()) !==
          JSON.stringify(currentServerUserReactions.sort());
        const needsCountsUpdate =
          JSON.stringify(localReactionCounts) !==
          JSON.stringify(serverReactionCounts);

        if (needsUserReactionsUpdate || needsCountsUpdate) {
          const apply = (p: Post): Post => ({
            ...p,
            userReactions: currentServerUserReactions,
            reactionCounts: serverReactionCounts,
          });
          updatePostInCaches(queryClient, post.id, apply);

          if (needsUserReactionsUpdate) {
            setLocalUserReactions(currentServerUserReactions);
          }
          if (needsCountsUpdate) {
            setLocalReactionCounts(serverReactionCounts);
          }
        }
        // 서버와 로컬이 동일하면 아무것도 하지 않음 (낙관적 업데이트 유지)
      },

      onSettled: () => {
        // no global invalidation
      },
    });

    const handleReaction = (type: "LIKE" | "BOOKMARK" | "BOOST") => {
      reactMutation.mutate({ type });
    };

    // 텍스트 파싱 (메모이제이션)
    const tokens = useMemo(() => parseRichText(postText), [postText]);

    // 미디어 파싱 (JSON string → array, 메모이제이션)
    const mediaItems: MediaItem[] = useMemo(() => {
      if (!postMedia) return [];
      return typeof postMedia === "string" ? JSON.parse(postMedia) : postMedia;
    }, [postMedia]);

    // 텍스트 렌더링 (메모이제이션)
    const renderText = useMemo(() => {
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
    }, [tokens]);

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

    // 시간 포맷팅 (메모이제이션)
    const formattedTime = useMemo(() => {
      return formatDistanceToNow(new Date(post.createdAt), {
        addSuffix: true,
        locale: ko,
      });
    }, [post.createdAt]);

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
                {formattedTime}
              </time>
              <div className="ml-auto">
                <button className="text-muted-foreground hover:text-foreground p-1">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 텍스트 내용 */}
            <div className="text-foreground mb-3 whitespace-pre-wrap break-words">
              {renderText}
            </div>

            {/* 미디어 */}
            {mediaItems.length > 0 && (
              <div
                className={cn(
                  "grid gap-2 mb-3 rounded-lg overflow-hidden",
                  getMediaGridClass(mediaItems.length)
                )}
              >
                {mediaItems
                  .slice(0, 4)
                  .map((item: MediaItem, index: number) => (
                    <div
                      key={index}
                      className={cn(
                        "relative bg-muted",
                        mediaItems.length === 3 && index === 0
                          ? "row-span-2"
                          : "",
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
                  hasUserReacted.LIKE && "text-red-500"
                )}
              >
                <div className="p-2 rounded-full group-hover:bg-red-500/10">
                  <Heart
                    className={cn(
                      "w-4 h-4",
                      hasUserReacted.LIKE && "fill-current"
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
                  hasUserReacted.BOOST && "text-green-500"
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
                  hasUserReacted.BOOKMARK && "text-blue-500"
                )}
              >
                <div className="p-2 rounded-full group-hover:bg-blue-500/10">
                  <Bookmark
                    className={cn(
                      "w-4 h-4",
                      hasUserReacted.BOOKMARK && "fill-current"
                    )}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  },
  (prevProps, nextProps) => {
    // post.id가 같고 필수 필드들이 변경되지 않았으면 리렌더 방지
    return (
      prevProps.post.id === nextProps.post.id &&
      prevProps.post.text === nextProps.post.text &&
      JSON.stringify(prevProps.post.reactionCounts) ===
        JSON.stringify(nextProps.post.reactionCounts) &&
      JSON.stringify(prevProps.post.userReactions) ===
        JSON.stringify(nextProps.post.userReactions) &&
      prevProps.post._count?.replies === nextProps.post._count?.replies &&
      prevProps.className === nextProps.className
    );
  }
);
