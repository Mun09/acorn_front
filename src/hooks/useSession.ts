"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { z } from "zod";

// 백엔드 응답과 일치하는 User 스키마
const UserSchema = z.object({
  id: z.number(), // string -> number로 변경
  email: z.string(),
  handle: z.string(),
  bio: z.string().nullable().optional(),
  trustScore: z.number(),
  verifiedFlags: z.record(z.boolean()).nullable(), // null 허용
  createdAt: z.string(),
  updatedAt: z.string(),
});

const SessionSchema = z.object({
  user: UserSchema,
  isAuthenticated: z.boolean(),
});

export type User = z.infer<typeof UserSchema>;
export type Session = z.infer<typeof SessionSchema>;

export function useSession() {
  const query = useQuery({
    queryKey: ["session"],
    queryFn: async (): Promise<Session> => {
      try {
        // 401 응답에 대한 자동 리다이렉트 방지를 위해 직접 fetch 사용
        const response = await fetch("/api/session", {
          credentials: "include", // 쿠키 포함
        });

        if (!response.ok) {
          return { user: null as any, isAuthenticated: false };
        }

        const data = await response.json();

        if (data.error) {
          return { user: null as any, isAuthenticated: false };
        }

        // 백엔드 응답 구조: { message, data: { user } }
        const user = UserSchema.parse(data.data.user);

        return {
          user,
          isAuthenticated: true,
        };
      } catch (error) {
        console.error("Session fetch error:", error);
        return { user: null as any, isAuthenticated: false };
      }
    },
    retry: 1,
    staleTime: 30 * 60 * 1000, // 30분으로 증가
    gcTime: 60 * 60 * 1000, // 1시간
    // 자동 리페치 최소화
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });

  // 주기적 토큰 갱신 (30분마다)
  useEffect(() => {
    if (!query.data?.isAuthenticated) return;

    const refreshInterval = setInterval(
      async () => {
        try {
          console.log("🔄 Attempting token refresh...");
          await fetch("/api/session/refresh", {
            method: "POST",
            credentials: "include",
          });
          console.log("✅ Token refreshed successfully");
        } catch (error) {
          console.error("❌ Token refresh failed:", error);
        }
      },
      30 * 60 * 1000
    ); // 30분

    return () => clearInterval(refreshInterval);
  }, [query.data?.isAuthenticated]);

  // console.log("🔄 useSession query state:", {
  //   data: query.data,
  //   isLoading: query.isLoading,
  //   isError: query.isError,
  //   error: query.error,
  //   status: query.status,
  //   fetchStatus: query.fetchStatus,
  // });

  return query;
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/session", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["session"], {
        user: null,
        isAuthenticated: false,
      });
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });
}
