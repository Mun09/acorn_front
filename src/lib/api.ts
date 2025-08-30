// API 클라이언트 설정 (Fetch 기반)

import { z } from "zod";
import { env, logger, isDevelopment } from "./config";
import { UserProfile } from "@/types/user";
import { Post } from "@/types";
import { auth } from "./firebaseClient";
import {
  MeResponseSchema,
  ProfileForm,
  UpdateUserRequest,
} from "@/types/schema";
import { Search } from "lucide-react";
import { SearchSymbolsResponseSchema } from "@/types/search/symbol";

// 공통 에러 타입
export interface ApiError {
  status: number;
  code?: string;
  message: string;
}

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

// 쿠키 유틸리티
const cookieUtils = {
  get(name: string): string | null {
    if (typeof document === "undefined") return null;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(";").shift() || null;
    }
    return null;
  },

  set(name: string, value: string, days: number = 7): void {
    if (typeof document === "undefined") return;

    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;secure;samesite=strict`;
  },

  remove(name: string): void {
    if (typeof document === "undefined") return;

    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  },
};

// 토큰 관리
export const tokenManager = {
  getToken(): string | null {
    return cookieUtils.get("acorn_token");
  },

  setToken(token: string): void {
    cookieUtils.set("acorn_token", token);
  },

  clearToken(): void {
    cookieUtils.remove("acorn_token");
  },
};

export class ApiFetch {
  private baseURL: string;
  private onUnauthorized?: () => void;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // 인증 실패 시 콜백 설정(예: 로그인 페이지 이동)
  setUnauthorizedHandler(handler: () => void): void {
    this.onUnauthorized = handler;
  }

  // ★ 세션 쿠키 재발급: Firebase에서 새 idToken → 서버 /auth/session-cookie 호출
  private async reissueSessionCookie(): Promise<boolean> {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const user = auth.currentUser;
      if (!user) {
        // 로그인 상태가 아님
        this.processQueue(
          new ApiError(401, "NO_CURRENT_USER", "로그인이 필요합니다"),
          false
        );
        return false;
      }

      // 새 idToken 발급 (forceRefresh = true 권장)
      const idToken = await user.getIdToken(true);

      const resp = await fetch(`${this.baseURL}/api/auth/session-cookie`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // httpOnly 쿠키 수신
        body: JSON.stringify({ idToken }),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        this.processQueue(
          new ApiError(
            401,
            "SESSION_COOKIE_REISSUE_FAILED",
            txt || "세션 재발급 실패"
          ),
          false
        );
        return false;
      }

      this.processQueue(null, true);
      return true;
    } catch (error: any) {
      this.processQueue(error, false);
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  // 큐에 쌓인 401 재시도 대기중 요청 처리
  private processQueue(error: any, success: boolean): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (success) resolve(true);
      else reject(error);
    });
    this.failedQueue = [];
  }

  // 기본 fetch 옵션
  private createRequestOptions(options: RequestInit = {}): RequestInit {
    const defaultHeaders: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };
    return {
      credentials: "include", // ★ 핵심: 세션 쿠키 포함
      ...options,
      headers: defaultHeaders,
    };
  }

  private createURL(endpoint: string): string {
    return `${this.baseURL}${endpoint}`;
  }

  // 공통 응답 처리(+ 401 자동 재발급)
  private async handleResponse<T>(
    response: Response,
    originalRequest?: () => Promise<Response>
  ): Promise<T> {
    if (response.status === 401 && originalRequest) {
      // 개발 로그 원하면 주석 해제
      // if (isDevelopment) logger.warn("API 401 Unauthorized - 세션 재발급 시도");

      const refreshed = await this.reissueSessionCookie();
      if (refreshed) {
        const retryRes = await originalRequest();
        return this.handleResponse<T>(retryRes); // 재귀 처리
      }

      // 재발급 실패 → 인증 해제
      if (this.onUnauthorized) this.onUnauthorized();
      else if (typeof window !== "undefined") window.location.href = "/login";

      throw new ApiError(401, "UNAUTHORIZED", "인증이 필요합니다.");
    }

    let data: any;
    const contentType = response.headers.get("content-type");
    data = contentType?.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw new ApiError(
        response.status,
        (data && (data.code || data.error)) || response.statusText,
        (data && data.message) ||
          `HTTP ${response.status} ${response.statusText}`
      );
    }

    return data;
  }

  async get<T>(endpoint: string, schema?: z.ZodSchema<T>): Promise<T> {
    const url = this.createURL(endpoint);
    const options = this.createRequestOptions({ method: "GET" });

    const makeRequest = () => fetch(url, options);
    const response = await makeRequest();
    const data = await this.handleResponse<T>(response, makeRequest);
    return schema ? schema.parse(data) : data;
  }

  async post<T>(
    endpoint: string,
    body?: any,
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    const url = this.createURL(endpoint);
    const options = this.createRequestOptions({
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });

    const makeRequest = () => fetch(url, options);
    const response = await makeRequest();
    const data = await this.handleResponse<T>(response, makeRequest);
    return schema ? schema.parse(data) : data;
  }

  async patch<T>(
    endpoint: string,
    body?: any,
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    const url = this.createURL(endpoint);
    const options = this.createRequestOptions({
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });

    const makeRequest = () => fetch(url, options);
    const response = await makeRequest();
    const data = await this.handleResponse<T>(response, makeRequest);
    return schema ? schema.parse(data) : data;
  }

  async delete<T>(endpoint: string, schema?: z.ZodSchema<T>): Promise<T> {
    const url = this.createURL(endpoint);
    const options = this.createRequestOptions({ method: "DELETE" });

    const makeRequest = () => fetch(url, options);
    const response = await makeRequest();
    const data = await this.handleResponse<T>(response, makeRequest);
    return schema ? schema.parse(data) : data;
  }
}

// 커스텀 ApiError 클래스
export class ApiError extends Error {
  public status: number;
  public code?: string;

  constructor(status: number, code?: string, message?: string) {
    super(message || `API Error ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

// API 클라이언트 인스턴스
export const apiClient = new ApiFetch(env.NEXT_PUBLIC_API_BASE_URL);

// 401 처리를 위한 훅
export function useApiUnauthorizedHandler() {
  const handleUnauthorized = () => {
    if (isDevelopment) {
      logger.warn("사용자 인증 만료 - 로그인 페이지로 이동");
    }

    // 토큰 삭제
    tokenManager.clearToken();

    // 홈페이지에서는 자동 리다이렉트하지 않음
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      if (currentPath !== "/" && currentPath !== "/home") {
        window.location.href = "/login";
      }
    }
  };

  // API 클라이언트에 핸들러 설정
  apiClient.setUnauthorizedHandler(handleUnauthorized);

  return { handleUnauthorized };
}

// API 엔드포인트 헬퍼들
export const authApi = {
  signup: (idToken: string, handle: string) =>
    apiClient.post("/api/auth/signup", { idToken, handle }),

  logout: () => apiClient.post("/api/auth/logout"),

  getMe: () => apiClient.get("/api/auth/me", MeResponseSchema),

  deleteMe: () => apiClient.delete("/api/auth/me"),

  patchMe: (data: UpdateUserRequest) => apiClient.patch("/api/auth/me", data),

  createSessionCookie: (idToken: string) =>
    apiClient.post("/api/auth/session-cookie", { idToken }),

  getExistingHandle: async (handle: string): Promise<UserProfile | null> => {
    const resp: { user: UserProfile | null } = await apiClient.get(
      `/api/auth/${handle}/test`
    );
    return resp.user || null;
  },
};

export const postsApi = {
  getFeed: (queryString?: string) =>
    apiClient.get(`/api/feed${queryString ? `?${queryString}` : ""}`),

  getPost: (id: number) => apiClient.get(`/api/posts/${id}`),

  createPost: (
    text: string,
    media?: Array<{ url: string; type: "image" | "video" }>,
    replyTo?: number
  ) => apiClient.post("/api/posts", { text, media, replyTo }),

  updatePost: (
    id: number,
    text: string,
    media?: Array<{ url: string; type: "image" | "video" }>
  ) => apiClient.patch(`/api/posts/${id}`, { text, media }),

  deletePost: (id: number) => apiClient.delete(`/api/posts/${id}`),

  reactToPost: (id: number, type: "LIKE" | "BOOKMARK" | "BOOST") =>
    apiClient.post(`/api/posts/${id}/react`, { type }),

  // 백엔드는 토글 방식이므로 같은 엔드포인트를 사용
  unreactToPost: (id: number, type: "LIKE" | "BOOKMARK" | "BOOST") =>
    apiClient.post(`/api/posts/${id}/react`, { type }),

  getBookmarkedPosts: (options?: { cursor?: string; limit?: number }) => {
    const params = new URLSearchParams();
    if (options?.cursor) params.append("cursor", options.cursor);
    if (options?.limit) params.append("limit", options.limit.toString());
    return apiClient.get(`/api/posts/bookmarks?${params.toString()}`);
  },

  getMyReactions: (options?: {
    cursor?: string;
    limit?: number;
    type?: "LIKE" | "BOOKMARK" | "BOOST";
  }) => {
    const params = new URLSearchParams();
    if (options?.cursor) params.append("cursor", options.cursor);
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.type) params.append("type", options.type);
    return apiClient.get(`/api/posts/my-reactions?${params.toString()}`);
  },

  getUserPosts: (
    handle: string,
    options?: { cursor?: string; limit?: number }
  ): Promise<{
    posts: Post[];
    nextCursor: string | null;
    hasMore: boolean;
  }> => {
    const params = new URLSearchParams();
    if (options?.cursor) params.append("cursor", options.cursor);
    if (options?.limit) params.append("limit", options.limit.toString());
    return apiClient.get(`/api/users/${handle}/posts?${params.toString()}`);
  },
};

export const usersApi = {
  getProfile: async (handle: string) => {
    const resp: { user: UserProfile } = await apiClient.get(
      `/api/users/${handle}`
    );
    return resp.user;
  },

  getUserPosts: async (
    handle: string,
    options?: { cursor?: string; limit?: number }
  ) => {
    const params = new URLSearchParams();
    if (options?.cursor) params.append("cursor", options.cursor);
    if (options?.limit) params.append("limit", options.limit.toString());
    const qs = params.toString();

    const resp: any = await apiClient.get(
      `/api/users/${handle}/posts${qs ? `?${qs}` : ""}`
    );

    const posts = resp.posts || resp.data?.posts || [];
    const nextCursor = resp.nextCursor || resp.data?.nextCursor || null;
    const hasMore =
      typeof resp.hasMore === "boolean"
        ? resp.hasMore
        : (resp.data?.hasMore ?? (nextCursor ? true : false));

    return { posts, nextCursor, hasMore, raw: resp };
  },

  updateProfile: (data: ProfileForm) => apiClient.patch("/api/users/me", data),

  followUser: (handle: string): Promise<void> =>
    apiClient.post(`/api/users/${handle}/follow`).then(() => {}),

  unfollowUser: (handle: string): Promise<void> =>
    apiClient.post(`/api/users/${handle}/follow`).then(() => {}),

  getFollowers: (handle: string) =>
    apiClient.get(`/api/users/${handle}/followers`),

  getFollowing: (handle: string) =>
    apiClient.get(`/api/users/${handle}/following`),
};

export const notificationsApi = {
  getNotifications: (queryString?: string) =>
    apiClient.get(`/api/notifications${queryString ? `?${queryString}` : ""}`),

  getUnreadCount: () => apiClient.get("/api/notifications/unread-count"),

  markAsRead: (notificationId: number) =>
    apiClient.patch(`/api/notifications/${notificationId}/mark-read`),

  markAllAsRead: () => apiClient.patch("/api/notifications/mark-read"),
};

export const searchApi = {
  search: (options?: {
    type: "people" | "posts";
    query?: string;
    limit?: number;
    cursor?: string;
  }) => {
    const params = new URLSearchParams();
    if (options?.type) params.append("type", options.type);
    if (options?.query) params.append("query", options.query);
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.cursor) params.append("cursor", options.cursor);
    return apiClient.get(`/api/search?${params.toString()}`);
  },
};

export const symbolsApi = {
  getSymbol: (ticker: string) => apiClient.get(`/api/symbols/${ticker}`),

  getSymbolPosts: (ticker: string, queryString?: string) =>
    apiClient.get(
      `/api/symbols/${ticker}/posts${queryString ? `?${queryString}` : ""}`
    ),

  getSymbolFeed: (queryString?: string) =>
    apiClient.get(`/api/symbols/feed${queryString ? `?${queryString}` : ""}`),

  getTrendingPosts: (queryString?: string) =>
    apiClient.get(`/api/posts/trending${queryString ? `?${queryString}` : ""}`),

  searchSymbols: (options?: {
    query?: string;
    limit?: number;
    cursor?: string;
  }) => {
    const params = new URLSearchParams();
    if (options?.query) params.append("query", options.query);
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.cursor) params.append("cursor", options.cursor);
    return apiClient.get(
      `/api/symbols/search?${params.toString()}`,
      SearchSymbolsResponseSchema
    );
  },

  getPopularSymbols: (limit?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    return apiClient.get(`/api/symbols?${params.toString()}`);
  },

  getSymbolSentiment: (ticker: string) =>
    apiClient.get(`/api/symbols/${ticker}/sentiment`),
};

// 기본 export
export default apiClient;
