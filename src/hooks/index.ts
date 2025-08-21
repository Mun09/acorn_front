// React 커스텀 훅들

import { useState, useEffect, useCallback } from "react";
import { authApi, tokenManager } from "@/lib/api";
import { User, AuthResponse } from "@/types";

// 인증 상태 관리 훅
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 사용자 정보 로드
  const loadUser = useCallback(async () => {
    try {
      const tokens = tokenManager.getTokens();
      if (!tokens?.accessToken) {
        setLoading(false);
        return;
      }

      const response = await authApi.getMe();
      if (response.data?.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Failed to load user:", error);
      tokenManager.clearTokens();
    } finally {
      setLoading(false);
    }
  }, []);

  // 로그인
  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      const authData = response.data as AuthResponse;

      // 토큰 저장
      tokenManager.setTokens({
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
        expiresIn: authData.expiresIn,
      });

      setUser(authData.user);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || "Login failed",
      };
    }
  }, []);

  // 회원가입
  const signup = useCallback(
    async (email: string, handle: string, password: string) => {
      try {
        const response = await authApi.signup(email, handle, password);
        const authData = response.data as AuthResponse;

        // 토큰 저장
        tokenManager.setTokens({
          accessToken: authData.accessToken,
          refreshToken: authData.refreshToken,
          expiresIn: authData.expiresIn,
        });

        setUser(authData.user);
        setIsAuthenticated(true);

        return { success: true };
      } catch (error: any) {
        return {
          success: false,
          error: error.response?.data?.message || "Signup failed",
        };
      }
    },
    []
  );

  // 로그아웃
  const logout = useCallback(async () => {
    try {
      const tokens = tokenManager.getTokens();
      if (tokens?.refreshToken) {
        await authApi.logout(tokens.refreshToken);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      tokenManager.clearTokens();
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // 컴포넌트 마운트 시 사용자 정보 로드
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return {
    user,
    loading,
    isAuthenticated,
    login,
    signup,
    logout,
    loadUser,
  };
}

// 로컬 스토리지 훅
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setStoredValue = useCallback(
    (newValue: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          newValue instanceof Function ? newValue(value) : newValue;
        setValue(valueToStore);

        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, value]
  );

  return [value, setStoredValue] as const;
}

// 디바운스 훅
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// API 상태 관리 훅
export function useApi<T>(apiCall: () => Promise<T>, dependencies: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

// 다크모드 훅
export function useDarkMode() {
  const [isDark, setIsDark] = useLocalStorage("darkMode", false);

  const toggleDarkMode = useCallback(() => {
    setIsDark(!isDark);

    if (typeof window !== "undefined") {
      if (!isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [isDark, setIsDark]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [isDark]);

  return {
    isDark,
    toggleDarkMode,
  };
}
