"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
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
  return useQuery({
    queryKey: ["session"],
    queryFn: async (): Promise<Session> => {
      try {
        const response = await fetch("/api/session");

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
        return { user: null as any, isAuthenticated: false };
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5분
  });
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
