"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useSession } from "@/hooks/useSession";
import { usersApi } from "@/lib/api";
import { PostCard } from "@/features/posts/PostCard";
import { Button } from "@/components/ui/Button";
import { User } from "@/hooks/useSession";

export default function ProfilePage() {
  const { data: session, isLoading: sessionLoading } = useSession();

  if (sessionLoading) return null;

  if (!session?.isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h2 className="text-xl font-semibold mb-4">프로필 보기</h2>
        <p className="text-muted-foreground mb-4">
          로그인해야 개인 프로필을 볼 수 있습니다.
        </p>
        <Link href="/login" className="inline-block">
          <Button>로그인</Button>
        </Link>
      </div>
    );
  }

  const handle = (session.user as any)?.handle as string;

  const {
    data: profileResp,
    isLoading: profileLoading,
    isError: profileError,
  } = useQuery({
    queryKey: ["profile", handle],
    queryFn: () => usersApi.getProfile(handle),
    enabled: !!handle,
    staleTime: 1000 * 60 * 5,
  });

  const profile: any = useMemo(() => {
    if (!profileResp) return null;
    // api client responses vary; normalize
    return (
      (profileResp as any).data?.user ||
      (profileResp as any).user ||
      profileResp
    );
  }, [profileResp]);

  const {
    data: postsPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: postsLoading,
  } = useInfiniteQuery({
    queryKey: ["user-posts", handle],
    initialPageParam: undefined,
    queryFn: async ({ pageParam = undefined }) => {
      // Use usersApi helper to keep API calls consistent
      const resp = await usersApi.getUserPosts(handle, {
        cursor: pageParam as string | undefined,
        limit: 20,
      });
      return resp;
    },
    getNextPageParam: (lastPage: any) =>
      // support multiple possible shapes returned by different endpoints/wrappers
      lastPage.nextCursor || lastPage.data?.nextCursor || null,
    enabled: !!handle,
  });

  const posts = useMemo(() => {
    if (!postsPages) return [];
    // backend returns { posts, hasMore, nextCursor } or { data: { posts } }
    return postsPages.pages.flatMap((p: any) => p.posts || p.data?.posts || []);
  }, [postsPages]);

  if (profileLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-32"></div>
          <div className="h-4 bg-muted rounded w-48"></div>
        </div>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">
          프로필을 불러올 수 없습니다
        </h2>
        <p className="text-sm text-muted-foreground">잠시 후 다시 시도하세요</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xl font-semibold">
            {(profile.handle || handle)?.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                @{profile.handle || handle}
              </h1>
              <div className="text-sm text-muted-foreground">
                신뢰도: {profile.trustScore ?? 0}
              </div>
            </div>
            {profile.bio && (
              <p className="text-sm text-muted-foreground mt-2">
                {profile.bio}
              </p>
            )}

            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <div>{profile.stats?.posts ?? 0} 포스트</div>
              <div>{profile.stats?.followers ?? 0} 팔로워</div>
              <div>{profile.stats?.following ?? 0} 팔로잉</div>
            </div>
          </div>

          <div>
            <Link href="/settings">
              <Button variant="outline">프로필 수정</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">내 포스트</h2>

        {postsLoading ? (
          <div className="text-muted-foreground">로딩 중...</div>
        ) : posts.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            작성한 포스트가 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))}

            {hasNextPage && (
              <div className="text-center mt-4">
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? "로딩 중..." : "더 보기"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
