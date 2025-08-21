// API 클라이언트 설정

import axios, { AxiosInstance, AxiosResponse } from "axios";
import { AuthTokens, ApiResponse } from "@/types";
import { storage } from "./utils";
import { env, getApiUrl, logger, isDevelopment } from "./config";

// Axios 인스턴스 생성
export const apiClient: AxiosInstance = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// 토큰 관리
const TOKEN_STORAGE_KEY = "acorn_tokens";

export const tokenManager = {
  getTokens(): AuthTokens | null {
    return storage.get(TOKEN_STORAGE_KEY);
  },

  setTokens(tokens: AuthTokens): void {
    storage.set(TOKEN_STORAGE_KEY, tokens);
  },

  clearTokens(): void {
    storage.remove(TOKEN_STORAGE_KEY);
  },

  getAccessToken(): string | null {
    const tokens = this.getTokens();
    return tokens?.accessToken || null;
  },
};

// 요청 인터셉터 - 자동으로 토큰 추가
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = tokenManager.getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 401 에러 시 토큰 갱신 시도
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 401 에러이고 아직 재시도하지 않은 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const tokens = tokenManager.getTokens();
      if (tokens?.refreshToken) {
        try {
          // 토큰 갱신 시도
          const response = await axios.post(getApiUrl("/api/auth/refresh"), {
            refreshToken: tokens.refreshToken,
          });

          const newTokens: AuthTokens = {
            accessToken: response.data.data.accessToken,
            refreshToken: tokens.refreshToken, // 기존 refresh token 유지
            expiresIn: response.data.data.expiresIn,
          };

          tokenManager.setTokens(newTokens);

          // 원래 요청에 새 토큰 적용하여 재시도
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // 갱신 실패 시 로그아웃
          if (isDevelopment) {
            logger.warn("토큰 갱신 실패:", refreshError);
          }
          tokenManager.clearTokens();
          window.location.href = "/auth/login";
          return Promise.reject(refreshError);
        }
      } else {
        // refresh token이 없으면 로그인 페이지로
        window.location.href = "/auth/login";
      }
    }

    return Promise.reject(error);
  }
);

// API 헬퍼 함수들
export const api = {
  // GET 요청
  get: <T = any>(url: string, params?: any): Promise<ApiResponse<T>> => {
    return apiClient.get(url, { params }).then((res) => res.data);
  },

  // POST 요청
  post: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> => {
    return apiClient.post(url, data).then((res) => res.data);
  },

  // PUT 요청
  put: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> => {
    return apiClient.put(url, data).then((res) => res.data);
  },

  // DELETE 요청
  delete: <T = any>(url: string): Promise<ApiResponse<T>> => {
    return apiClient.delete(url).then((res) => res.data);
  },

  // PATCH 요청
  patch: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> => {
    return apiClient.patch(url, data).then((res) => res.data);
  },
};

// 특정 API 엔드포인트들
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/api/auth/login", { email, password }),

  signup: (email: string, handle: string, password: string) =>
    api.post("/api/auth/signup", { email, handle, password }),

  logout: (refreshToken: string) =>
    api.post("/api/auth/logout", { refreshToken }),

  logoutAll: () => api.post("/api/auth/logout-all"),

  getMe: () => api.get("/api/auth/me"),

  refresh: (refreshToken: string) =>
    api.post("/api/auth/refresh", { refreshToken }),
};

export const postsApi = {
  getFeed: (page = 1, limit = 20) => api.get("/api/posts", { page, limit }),

  getPost: (id: number) => api.get(`/api/posts/${id}`),

  createPost: (text: string, media?: any) =>
    api.post("/api/posts", { text, media }),

  deletePost: (id: number) => api.delete(`/api/posts/${id}`),

  likePost: (id: number) => api.post(`/api/posts/${id}/like`),

  unlikePost: (id: number) => api.delete(`/api/posts/${id}/like`),
};
