"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PostCard } from "@/features/posts/PostCard";
import { Button } from "@/components/ui/Button";
import { MessageCircle, Send, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/hooks/useSession";
import { postsApi } from "@/lib/api";
import { Post } from "@/types/post";

// 댓글 컴포넌트
function ReplyCard({ reply }: { reply: any }) {
  return (
    <div className="border-l-2 border-muted pl-4 py-3">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
          <span className="text-xs font-medium">
            {reply.user?.handle?.charAt(0).toUpperCase() || "U"}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-sm text-foreground">
              @{reply.user?.handle || "unknown"}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(reply.createdAt).toLocaleString()}
            </span>
          </div>

          <div className="text-sm text-foreground whitespace-pre-wrap">
            {reply.text}
          </div>

          <div className="flex items-center space-x-4 mt-2">
            <button className="flex items-center space-x-1 text-muted-foreground hover:text-red-500 transition-colors">
              <MessageCircle className="w-3 h-3" />
              <span className="text-xs">{reply.reactionCounts?.LIKE || 0}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 댓글 작성 컴포넌트
function ReplyComposer({ postId }: { postId: number }) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const createReplyMutation = useMutation({
    mutationFn: (data: { text: string; replyTo: number }) =>
      postsApi.createPost(data.text, undefined, data.replyTo),
    onSuccess: () => {
      setContent("");
      // 댓글 목록 새로고침
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createReplyMutation.mutateAsync({
        text: content.trim(),
        replyTo: postId,
      });
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
                className="flex items-center gap-2"
              >
                <Send className="w-3 h-3" />
                {isSubmitting ? "게시 중..." : "댓글 작성"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = parseInt(params.id as string);

  // 포스트 데이터 가져오기
  const {
    data: post,
    isLoading: postLoading,
    error: postError,
  } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      const response: any = await postsApi.getPost(postId);
      return response.data;
    },
    enabled: !isNaN(postId),
  });

  if (postLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로가기
          </Button>
        </div>

        {/* 로딩 상태 */}
        <div className="space-y-6">
          <div className="border border-border rounded-lg p-4">
            <div className="animate-pulse">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="space-y-1">
                  <div className="h-4 bg-muted rounded w-20"></div>
                  <div className="h-3 bg-muted rounded w-16"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로가기
          </Button>
        </div>

        {/* 에러 상태 */}
        <div className="text-center py-12">
          <div className="mb-4">
            <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground/50" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            포스트를 찾을 수 없습니다
          </h2>
          <p className="text-muted-foreground mb-6">
            요청하신 포스트가 삭제되었거나 존재하지 않습니다.
          </p>
          <Link
            href="/"
            className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // 실제 포스트 데이터 사용 (API 응답 구조 고려)
  const postData = (post as any)?.data || post;

  return (
    <div className="max-w-2xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          뒤로가기
        </Button>
      </div>

      {/* 메인 포스트 */}
      <div className="mb-6">
        <PostCard post={postData} />
      </div>

      {/* 댓글 작성 */}
      <div className="mb-6">
        <ReplyComposer postId={postId} />
      </div>

      {/* 댓글 목록 */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          댓글 ({postData.replies?.length || 0})
        </h3>

        {postData.replies && postData.replies.length > 0 ? (
          <div className="space-y-3">
            {postData.replies.map((reply: any) => (
              <ReplyCard key={reply.id} reply={reply} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>아직 댓글이 없습니다.</p>
            <p className="text-sm">첫 번째 댓글을 작성해보세요!</p>
          </div>
        )}
      </div>
    </div>
  );
}
