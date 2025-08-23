import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "./useSession";
import { symbolsApi } from "@/lib/api";
import { useMemo, useCallback } from "react";

/**
 * 사용자의 모든 reactions을 가져와서 캐시에 저장하는 훅
 * PostCard에서 userReactions이 누락된 경우를 대비해 사용
 */
export function useUserReactions() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // 사용자의 모든 reactions 가져오기
  const { data: userReactionsData, isLoading } = useQuery({
    queryKey: ["userReactions", "all"],
    queryFn: async () => {
      // 각 타입별로 reactions 가져오기
      const [likes, bookmarks, boosts] = await Promise.all([
        symbolsApi.getMyReactions({ limit: 500, type: "LIKE" }),
        symbolsApi.getMyReactions({ limit: 500, type: "BOOKMARK" }),
        symbolsApi.getMyReactions({ limit: 500, type: "BOOST" }),
      ]);

      return {
        likes: (likes as any)?.data?.posts || [],
        bookmarks: (bookmarks as any)?.data?.posts || [],
        boosts: (boosts as any)?.data?.posts || [],
      };
    },
    enabled: !!session?.isAuthenticated,
    staleTime: 30 * 60 * 1000, // 30분으로 증가
    gcTime: 60 * 60 * 1000, // 1시간
    refetchOnWindowFocus: false,
  });

  // reactions 데이터를 Map으로 변환 (빠른 조회를 위해)
  const userReactionsMap = useMemo(() => {
    const map = new Map<number, string[]>();

    if (userReactionsData) {
      // 각 post별로 사용자가 한 reactions를 맵핑
      userReactionsData.likes.forEach((post: any) => {
        const postId = post.id;
        const reactions = map.get(postId) || [];
        reactions.push("LIKE");
        map.set(postId, reactions);
      });

      userReactionsData.bookmarks.forEach((post: any) => {
        const postId = post.id;
        const reactions = map.get(postId) || [];
        reactions.push("BOOKMARK");
        map.set(postId, reactions);
      });

      userReactionsData.boosts.forEach((post: any) => {
        const postId = post.id;
        const reactions = map.get(postId) || [];
        reactions.push("BOOST");
        map.set(postId, reactions);
      });
    }

    return map;
  }, [userReactionsData]);

  // 특정 post의 user reactions 반환
  const getUserReactionsForPost = useCallback(
    (postId: number): string[] => {
      return userReactionsMap.get(postId) || [];
    },
    [userReactionsMap]
  );

  // reactions 캐시 무효화 (새로운 reaction 후 호출)
  const invalidateUserReactions = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["userReactions", "all"],
    });
  }, [queryClient]);

  return {
    isLoading,
    getUserReactionsForPost,
    invalidateUserReactions,
    userReactionsData,
  };
}
