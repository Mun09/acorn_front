"use client";

import { authApi } from "@/lib/api";
import { MeResponseSchema, Session } from "@/types/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useSession() {
  const query = useQuery({
    queryKey: ["session"],
    queryFn: async (): Promise<Session> => {
      try {
        // 백엔드로 바로 호출 (세션 쿠키 사용)
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/me`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const parsed = MeResponseSchema.parse(res.json());

        return { user: parsed.data.user, isAuthenticated: true };
      } catch (e: any) {
        return { user: null, isAuthenticated: false };
      }
    },
    retry: 1,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });

  return query;
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.setQueryData(["session"], {
        user: null,
        isAuthenticated: false,
      });
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });
}
