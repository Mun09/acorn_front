"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { useEffect, useState } from "react";
import { UserProfile } from "@/types/user";

type FollowButtonProps = {
  cacheKey: readonly unknown[];
  profileHandle: string;
  isFollowing: boolean;
};

export function FollowButton({
  cacheKey,
  profileHandle,
  isFollowing,
}: FollowButtonProps) {
  const qc = useQueryClient();
  console.log("FollowButton", { profileHandle, isFollowing });
  const [localFollowing, setLocalFollowing] = useState(isFollowing);

  useEffect(() => {
    setLocalFollowing(isFollowing);
  }, [isFollowing]);

  //   console.log("FollowButton", { profileHandle, isFollowing });

  const follow = useMutation({
    mutationFn: () => usersApi.followUser(profileHandle),
    onMutate: async () => {
      setLocalFollowing(true);
      await qc.cancelQueries({ queryKey: cacheKey });
      const prev = qc.getQueryData<UserProfile>(cacheKey);

      qc.setQueryData<UserProfile | undefined>(cacheKey, (old) =>
        old
          ? {
              ...old,
              isFollowing: true,
              stats: {
                ...old.stats,
                followers: (old.stats?.followers ?? 0) + 1,
              },
            }
          : old
      );

      return { prev };
    },
    onError: (_e, _v, ctx) => {
      // 롤백
      setLocalFollowing(false);
      if (ctx?.prev) qc.setQueryData(cacheKey, ctx.prev);
    },
    onSettled: () => {
      //   qc.invalidateQueries({ queryKey: cacheKey, refetchType: "active" });
    },
  });

  const unfollow = useMutation({
    mutationFn: () => usersApi.unfollowUser(profileHandle),
    onMutate: async () => {
      setLocalFollowing(false);
      await qc.cancelQueries({ queryKey: cacheKey });
      const prev = qc.getQueryData<any>(cacheKey);
      qc.setQueryData(cacheKey, (old: any) =>
        old
          ? {
              ...old,
              isFollowing: false,
              stats: {
                ...old.stats,
                followers: Math.max(0, (old.stats?.followers ?? 0) - 1),
              },
            }
          : old
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      setLocalFollowing(true);
      if (ctx?.prev) qc.setQueryData(["profile", profileHandle], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: cacheKey, refetchType: "active" });
    },
  });

  return localFollowing ? (
    <Button
      variant="secondary"
      onClick={() => unfollow.mutate()}
      disabled={unfollow.isPending}
    >
      언팔로우
    </Button>
  ) : (
    <Button onClick={() => follow.mutate()} disabled={follow.isPending}>
      팔로우
    </Button>
  );
}
