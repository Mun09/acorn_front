"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import { PostCard } from "@/features/posts/PostCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MessageCircle, Send, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/hooks/useSession";
import { postsApi } from "@/lib/api";

// 댓글 컴포넌트
function ReplyCard({ reply }: { reply: any }) {
  return (
    <div className="border-l-2 border-muted pl-4 py-3">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
          <span className="text-xs font-medium">
            {reply.user.handle.charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-sm text-foreground">
              @{reply.user.handle}
            </span>
            {reply.user.isVerified && (
              <span className="text-blue-500 text-xs">✓</span>
            )}
            <span className="text-xs text-muted-foreground">
              {new Date(reply.createdAt).toLocaleString()}
            </span>
          </div>

          <div className="text-sm text-foreground whitespace-pre-wrap">
            {reply.content}
          </div>

          <div className="flex items-center space-x-4 mt-2">
            <button className="flex items-center space-x-1 text-muted-foreground hover:text-red-500 transition-colors">
              <MessageCircle className="w-3 h-3" />
              <span className="text-xs">
                {reply.reactionCounts?.likes || 0}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 댓글 작성 폼
function ReplyForm({
  postId,
  onSuccess,
}: {
  postId: string;
  onSuccess: () => void;
}) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const createReplyMutation = useMutation({
    mutationFn: async (replyData: { content: string }) => {
      // 실제 API 호출: /posts/:id/reply
      // 여기서는 더미 응답
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        id: Date.now().toString(),
        content: replyData.content,
        createdAt: new Date().toISOString(),
        user: {
          id: session?.user?.id || "unknown",
          handle: session?.user?.handle || "anonymous",
          isVerified: false,
        },
        reactionCounts: { likes: 0 },
      };
    },
    onSuccess: () => {
      // 댓글 목록 새로고침
      queryClient.invalidateQueries({ queryKey: ["post-replies", postId] });
      setContent("");
      onSuccess();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createReplyMutation.mutateAsync({ content: content.trim() });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session?.isAuthenticated) {
    return (
      <div className="text-center py-6 bg-muted/50 rounded-lg">
        <p className="text-muted-foreground mb-4">
          댓글을 작성하려면 로그인하세요
        </p>
        <Link
          href="/login"
          className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          로그인
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <MessageCircle className="w-4 h-4" />
        댓글 작성
      </h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <span className="text-xs font-medium">
              {session?.user?.handle?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>

          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="댓글을 입력하세요..."
              className="w-full min-h-[80px] p-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
              maxLength={500}
            />

            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                {content.length}/500
              </span>

              <Button
                type="submit"
                disabled={!content.trim() || isSubmitting}
                size="sm"
                className="flex items-center gap-1"
              >
                <Send className="w-3 h-3" />
                {isSubmitting ? "전송 중..." : "댓글 작성"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

// 간단한 Intersection Observer 훅
function useIntersectionObserver(callback: () => void, deps: any[]) {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, deps);

  return targetRef;
}

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.id as string;
  const queryClient = useQueryClient();

  // 원글 데이터 가져오기
  const {
    data: post,
    isLoading: postLoading,
    isError: postError,
    error: postErrorDetails,
  } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      // 실제 API 호출: /posts/:id
      // 여기서는 더미 데이터
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (Math.random() > 0.9) {
        throw new Error("포스트를 찾을 수 없습니다");
      }

      return {
        id: parseInt(postId) || 1,
        content: `이것은 포스트 ${postId}의 상세 내용입니다. 여기에는 더 긴 텍스트와 다양한 정보가 포함될 수 있습니다. $AAPL 오늘 움직임이 정말 흥미로웠어요! 📈\n\n기술적 분석을 해보면 지지선을 잘 지키고 있는 것 같네요. 다음 주 실적 발표가 기대됩니다.`,
        text: `이것은 포스트 ${postId}의 상세 내용입니다. 여기에는 더 긴 텍스트와 다양한 정보가 포함될 수 있습니다. $AAPL 오늘 움직임이 정말 흥미로웠어요! 📈\n\n기술적 분석을 해보면 지지선을 잘 지키고 있는 것 같네요. 다음 주 실적 발표가 기대됩니다.`,
        createdAt: new Date(
          Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        userId: 1,
        isHidden: false,
        user: {
          id: 1,
          handle: "techtrader",
          displayName: "테크 트레이더",
          avatarUrl: null,
          isVerified: true,
          email: "techtrader@example.com",
          trustScore: 85,
          createdAt: new Date(
            Date.now() - 365 * 24 * 60 * 60 * 1000
          ).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        mediaItems: [],
        symbols: [
          {
            symbolId: 1,
            symbol: {
              ticker: "AAPL",
              kind: "STOCK" as const,
              id: 1,
              exchange: "NASDAQ",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          },
          {
            symbolId: 2,
            symbol: {
              ticker: "GOOGL",
              kind: "STOCK" as const,
              id: 2,
              exchange: "NASDAQ",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          },
        ],
        reactionCounts: {
          likes: Math.floor(Math.random() * 100) + 10,
          replies: Math.floor(Math.random() * 50) + 5,
          boosts: Math.floor(Math.random() * 30) + 2,
          bookmarks: Math.floor(Math.random() * 20) + 1,
        },
        userReaction: null,
      };
    },
    enabled: !!postId,
  });

  // 댓글 목록 가져오기 (무한 스크롤)
  const {
    data: repliesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: repliesLoading,
    isError: repliesError,
  } = useInfiniteQuery({
    queryKey: ["post-replies", postId],
    queryFn: async ({ pageParam = undefined }) => {
      // 실제 API 호출: /posts/:id/replies?cursor=
      // 여기서는 더미 데이터
      await new Promise((resolve) => setTimeout(resolve, 300));

      const replies = Array.from({ length: 10 }, (_, i) => ({
        id: `reply-${postId}-${pageParam || 0}-${i}`,
        content: `이것은 댓글 ${i + 1}입니다. 좋은 포스트네요! ${Math.random() > 0.5 ? "👍" : "🤔"}`,
        createdAt: new Date(
          Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000
        ).toISOString(),
        user: {
          id: `user${i + 2}`,
          handle: `commenter${i + 1}`,
          isVerified: Math.random() > 0.8,
        },
        reactionCounts: {
          likes: Math.floor(Math.random() * 20),
        },
      }));

      return {
        data: {
          replies,
          nextCursor: Math.random() > 0.3 ? `cursor-${Date.now()}` : null,
        },
      };
    },
    getNextPageParam: (lastPage: any) => lastPage.data?.nextCursor || undefined,
    initialPageParam: undefined,
    enabled: !!postId,
  });

  // 무한 스크롤을 위한 Intersection Observer
  const loadMoreRef = useIntersectionObserver(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage]);

  // 댓글 작성 성공 시 콜백
  const handleReplySuccess = () => {
    // 원글의 댓글 수도 업데이트해야 함 (실제로는 API에서 처리)
    if (post) {
      queryClient.setQueryData(["post", postId], {
        ...post,
        reactionCounts: {
          ...post.reactionCounts,
          replies: post.reactionCounts.replies + 1,
        },
      });
    }
  };

  // 모든 댓글 플래튼화
  const replies =
    repliesData?.pages.flatMap((page: any) => page.data?.replies || []) || [];

  // 로딩 상태
  if (postLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로 가기
          </Link>
        </div>

        <div className="border border-border rounded-lg p-6">
          <div className="animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-muted rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-3 bg-muted rounded w-20"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (postError) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로 가기
          </Link>
        </div>

        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            포스트를 불러올 수 없습니다
          </h1>
          <p className="text-muted-foreground mb-6">
            {postErrorDetails?.message || "알 수 없는 오류가 발생했습니다"}
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* 뒤로 가기 버튼 */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          뒤로 가기
        </Link>
      </div>

      {/* 원글 */}
      <div className="mb-6">
        <PostCard post={post} />
      </div>

      {/* 댓글 작성 폼 */}
      <div className="mb-6">
        <ReplyForm postId={postId} onSuccess={handleReplySuccess} />
      </div>

      {/* 댓글 목록 */}
      <div className="bg-card border border-border rounded-lg">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            댓글 {post.reactionCounts.replies}개
          </h2>
        </div>

        <div className="p-4">
          {repliesLoading && replies.length === 0 && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-muted rounded w-1/4"></div>
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {repliesError && (
            <div className="text-center py-8">
              <p className="text-destructive mb-4">댓글을 불러올 수 없습니다</p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
              >
                다시 시도
              </Button>
            </div>
          )}

          {!repliesLoading && !repliesError && (
            <>
              {replies.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">아직 댓글이 없습니다</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    첫 번째 댓글을 작성해보세요!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {replies.map((reply: any) => (
                    <ReplyCard key={reply.id} reply={reply} />
                  ))}
                </div>
              )}

              {/* 무한 스크롤 트리거 */}
              {hasNextPage && (
                <div ref={loadMoreRef} className="py-6 text-center">
                  {isFetchingNextPage ? (
                    <div className="text-muted-foreground">
                      댓글을 더 불러오는 중...
                    </div>
                  ) : (
                    <Button
                      onClick={() => fetchNextPage()}
                      variant="outline"
                      size="sm"
                    >
                      댓글 더 보기
                    </Button>
                  )}
                </div>
              )}

              {!hasNextPage && replies.length > 0 && (
                <div className="py-6 text-center text-muted-foreground text-sm">
                  모든 댓글을 확인했습니다
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
