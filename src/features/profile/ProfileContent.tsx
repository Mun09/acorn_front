"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { UserPostsList } from "../posts/UserPostList";
import { FollowButton } from "./FollowButton";

type ProfileContentProps = {
  profileHandle: string; // 표시할 대상 유저
  viewerHandle?: string; // 로그인 유저 (없으면 비로그인)
};

export function ProfileContent({
  profileHandle,
  viewerHandle,
}: ProfileContentProps) {
  const isOwn = !!viewerHandle && viewerHandle === profileHandle;
  const cacheKey = ["profile", profileHandle];

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
  } = useQuery({
    queryKey: cacheKey,
    queryFn: () => usersApi.getProfile(profileHandle),
    enabled: !!profileHandle,
    staleTime: 1000 * 60 * 5,
  });

  if (profileLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-32" />
          <div className="h-4 bg-muted rounded w-48" />
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

  const handle = profile.handle || profileHandle;
  const stats = profile.stats;
  const trustScore = profile.trustScore ?? 0;
  const bio = profile.bio || "";
  const isFollowing = profile.isFollowing || false;

  console.log(profile);

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xl font-semibold">
            {handle.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">@{handle}</h1>
              {/* <div className="text-sm text-muted-foreground">
                신뢰도: {trustScore}
              </div> */}
            </div>
            {bio && <p className="text-sm text-muted-foreground mt-2">{bio}</p>}
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <div>{stats.posts} 포스트</div>
              <div>{stats.followers} 팔로워</div>
              <div>{stats.following} 팔로잉</div>
            </div>
          </div>

          <div>
            {isOwn ? (
              <Link href="/settings">
                <Button variant="outline">프로필 수정</Button>
              </Link>
            ) : (
              <FollowButton
                cacheKey={cacheKey}
                profileHandle={handle}
                isFollowing={!!isFollowing}
              />
            )}
          </div>
        </div>
      </div>

      {/* Posts */}
      <UserPostsList handle={handle} />
    </div>
  );
}
