// API 클라이언트 설정 (Fetch 기반)

import { z } from "zod";
import { env, getApiUrl, logger, isDevelopment } from "./config";

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

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // 인증 실패 시 콜백 설정
  setUnauthorizedHandler(handler: () => void): void {
    this.onUnauthorized = handler;
  }

  // 기본 fetch 옵션 생성
  private createRequestOptions(options: RequestInit = {}): RequestInit {
    const token = tokenManager.getToken();

    const defaultOptions: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // 토큰이 있으면 Authorization 헤더 추가
    if (token) {
      (defaultOptions.headers as Record<string, string>)["Authorization"] =
        `Bearer ${token}`;
    }

    return defaultOptions;
  }

  // URL 생성
  private createURL(endpoint: string): string {
    return `${this.baseURL}${endpoint}`;
  }

  // 응답 처리
  private async handleResponse<T>(response: Response): Promise<T> {
    // 401 Unauthorized 처리
    if (response.status === 401) {
      if (isDevelopment) {
        logger.warn("API 401 Unauthorized - 토큰 삭제 및 리다이렉트");
      }

      tokenManager.clearToken();

      if (this.onUnauthorized) {
        this.onUnauthorized();
      } else if (typeof window !== "undefined") {
        window.location.href = "/login";
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

    const response = await fetch(url, options);
    const data = await this.handleResponse<T>(response);

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

    const response = await fetch(url, options);
    const data = await this.handleResponse<T>(response);

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

    // 로그인 페이지로 리다이렉트
    if (typeof window !== "undefined") {
      window.location.href = "/login";
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
  getFeed: (params?: any) => apiClient.get("/api/posts", undefined),

  getPost: (id: number) => apiClient.get(`/api/posts/${id}`),

  createPost: (
    text: string,
    media?: Array<{ url: string; type: "image" | "video" }>
  ) => apiClient.post("/api/posts", { text, media }),

  updatePost: (
    id: number,
    text: string,
    media?: Array<{ url: string; type: "image" | "video" }>
  ) => apiClient.patch(`/api/posts/${id}`, { text, media }),

  deletePost: (id: number) => apiClient.delete(`/api/posts/${id}`),

  reactToPost: (id: number, type: "LIKE" | "BOOKMARK" | "BOOST") =>
    apiClient.post(`/api/posts/${id}/react`, { type }),

  unreactToPost: (id: number, type: "LIKE" | "BOOKMARK" | "BOOST") =>
    apiClient.delete(`/api/posts/${id}/react/${type}`),
};

export const usersApi = {
  getProfile: (handle: string) => apiClient.get(`/api/users/${handle}`),

  updateProfile: (data: any) => apiClient.patch("/api/users/me", data),

  followUser: (handle: string) => apiClient.post(`/api/users/${handle}/follow`),

  unfollowUser: (handle: string) =>
    apiClient.delete(`/api/users/${handle}/follow`),

  getFollowers: (handle: string) =>
    apiClient.get(`/api/users/${handle}/followers`),

  getFollowing: (handle: string) =>
    apiClient.get(`/api/users/${handle}/following`),
};

// 기본 export
export default apiClient;
