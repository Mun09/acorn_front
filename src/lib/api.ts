// API 클라이언트 설정 (Fetch 기반)

import { z } from "zod";
import { env, logger, isDevelopment } from "./config";
import { UserProfile } from "@/types/user";
import { Post } from "@/types";

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

// 커스텀 fetch 래퍼
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

  // 인증 실패 시 콜백 설정
  setUnauthorizedHandler(handler: () => void): void {
    this.onUnauthorized = handler;
  }

  // 토큰 갱신 처리
  private async refreshToken(): Promise<boolean> {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const response = await fetch("/api/session/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        this.processQueue(null, true);
        return true;
      } else {
        this.processQueue(
          new ApiError(401, "TOKEN_REFRESH_FAILED", "토큰 갱신 실패"),
          false
        );
        return false;
      }
    } catch (error) {
      this.processQueue(error, false);
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  // 큐에 있는 요청들 처리
  private processQueue(error: any, success: boolean): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (success) {
        resolve(success);
      } else {
        reject(error);
      }
    });

    this.failedQueue = [];
  }

  // 기본 fetch 옵션 생성
  private createRequestOptions(options: RequestInit = {}): RequestInit {
    // httpOnly 쿠키 사용으로 Authorization 헤더 불필요
    const defaultOptions: RequestInit = {
      credentials: "include", // httpOnly 쿠키 포함 (가장 중요!)
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    return defaultOptions;
  }

  // URL 생성
  private createURL(endpoint: string): string {
    return `${this.baseURL}${endpoint}`;
  }

  // 응답 처리
  private async handleResponse<T>(
    response: Response,
    originalRequest?: () => Promise<Response>
  ): Promise<T> {
    // 401 Unauthorized 처리 - 토큰 갱신 시도
    if (response.status === 401 && originalRequest) {
      if (isDevelopment) {
        logger.warn("API 401 Unauthorized - 토큰 갱신 시도");
      }

      const refreshSuccess = await this.refreshToken();

      if (refreshSuccess && originalRequest) {
        // 토큰 갱신 성공 시 원래 요청 재시도
        const retryResponse = await originalRequest();
        return this.handleResponse(retryResponse);
      }

      // 토큰 갱신 실패 시 기존 로직 실행
      tokenManager.clearToken();

      if (this.onUnauthorized) {
        this.onUnauthorized();
      } else if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        if (currentPath !== "/" && currentPath !== "/home") {
          window.location.href = "/login";
        }
      }

      throw new ApiError(401, "UNAUTHORIZED", "인증이 필요합니다.");
    }

    let data: any;
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      throw new ApiError(
        response.status,
        data.code || response.statusText,
        data.message || `HTTP ${response.status} ${response.statusText}`
      );
    }

    return data;
  }

  // GET 요청
  async get<T>(endpoint: string, schema?: z.ZodSchema<T>): Promise<T> {
    const url = this.createURL(endpoint);
    const options = this.createRequestOptions({ method: "GET" });

    if (isDevelopment) {
      logger.info("GET", url);
    }

    const makeRequest = () => fetch(url, options);
    const response = await makeRequest();
    const data = await this.handleResponse<T>(response, makeRequest);

    // Zod 스키마 검증
    if (schema) {
      return schema.parse(data);
    }

    return data;
  }

  // POST 요청
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

    if (isDevelopment) {
      logger.info("POST", url, body);
    }

    const makeRequest = () => fetch(url, options);
    const response = await makeRequest();
    const data = await this.handleResponse<T>(response, makeRequest);

    // Zod 스키마 검증
    if (schema) {
      return schema.parse(data);
    }

    return data;
  }

  // PATCH 요청
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

    if (isDevelopment) {
      logger.info("PATCH", url, body);
    }

    const response = await fetch(url, options);
    const data = await this.handleResponse<T>(response);

    // Zod 스키마 검증
    if (schema) {
      return schema.parse(data);
    }

    return data;
  }

  // DELETE 요청
  async delete<T>(endpoint: string, schema?: z.ZodSchema<T>): Promise<T> {
    const url = this.createURL(endpoint);
    const options = this.createRequestOptions({ method: "DELETE" });

    if (isDevelopment) {
      logger.info("DELETE", url);
    }

    const response = await fetch(url, options);
    const data = await this.handleResponse<T>(response);

    // Zod 스키마 검증
    if (schema) {
      return schema.parse(data);
    }

    return data;
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
  login: (email: string, password: string) =>
    apiClient.post("/api/auth/login", { email, password }),

  signup: (email: string, handle: string, password: string) =>
    apiClient.post("/api/auth/signup", { email, handle, password }),

  logout: () => apiClient.post("/api/auth/logout"),

  getMe: () => apiClient.get("/api/auth/me"),

  refresh: () => apiClient.post("/api/auth/refresh"),
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

  updateProfile: (data: any) => apiClient.patch("/api/users/me", data),

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
  search: (query: string, type?: "posts" | "people" | "symbols") => {
    const params = new URLSearchParams({ q: query });
    if (type) {
      params.append("type", type);
    }
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
    return apiClient.get(`/api/symbols/search?${params.toString()}`);
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
