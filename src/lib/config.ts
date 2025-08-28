import { Env, envSchema } from "@/types/schema";
import { z } from "zod";

// 환경변수 검증 및 파싱 함수
function validateEnv(): Env {
  try {
    // process.env에서 환경변수 추출
    const env = {
      NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
      NODE_ENV: process.env.NODE_ENV,
      LOG_LEVEL: process.env.LOG_LEVEL,
      ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS,
      NEXT_PUBLIC_GOOGLE_ANALYTICS_ID:
        process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    };

    // Zod로 검증
    const validatedEnv = envSchema.parse(env);

    // 개발 환경에서 성공 로그
    if (process.env.NODE_ENV === "development") {
      console.log("✅ Environment variables validated successfully");
      console.log("🔗 API Base URL:", validatedEnv.NEXT_PUBLIC_API_BASE_URL);
      console.log("🌰 App Name:", validatedEnv.NEXT_PUBLIC_APP_NAME);
    }

    return validatedEnv;
  } catch (error) {
    // Zod 검증 오류 처리
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err: z.ZodIssue) => {
        const path = err.path.join(".");
        return `❌ ${path}: ${err.message}`;
      });

      const errorMessage = [
        "🚨 Environment Variable Validation Failed!",
        "",
        "The following environment variables are invalid or missing:",
        ...errorMessages,
        "",
        "💡 Solutions:",
        "1. Copy .env.example to .env.local",
        "2. Fill in the required values",
        "3. Check the .env.example file for proper format",
        "",
        "📚 For more help, see: README.md",
      ].join("\n");

      // 개발 환경에서는 콘솔에 출력
      if (process.env.NODE_ENV === "development") {
        console.error(errorMessage);
      }

      // 빌드 타임에 프로세스 종료
      throw new Error(errorMessage);
    }

    // 기타 오류
    throw new Error(
      `❌ Unexpected error during environment validation: ${error}`
    );
  }
}

// 환경변수 객체 생성 (모듈 로드 시 검증)
export const env = validateEnv();

// 환경별 헬퍼 함수들
export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

// API URL 헬퍼
export const getApiUrl = (path: string = ""): string => {
  const baseUrl = env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, ""); // 끝의 슬래시 제거
  const cleanPath = path.replace(/^\//, ""); // 시작의 슬래시 제거
  return cleanPath ? `${baseUrl}/${cleanPath}` : baseUrl;
};

// 앱 정보 헬퍼
export const appInfo = {
  name: env.NEXT_PUBLIC_APP_NAME,
  version: env.NEXT_PUBLIC_APP_VERSION,
  url: env.NEXT_PUBLIC_APP_URL,
  isAnalyticsEnabled: env.ENABLE_ANALYTICS,
} as const;

// 로깅 헬퍼
export const logger = {
  debug: (...args: any[]) => {
    if (env.LOG_LEVEL === "debug") {
      console.log("[DEBUG]", ...args);
    }
  },
  info: (...args: any[]) => {
    if (["debug", "info"].includes(env.LOG_LEVEL)) {
      console.log("[INFO]", ...args);
    }
  },
  warn: (...args: any[]) => {
    if (["debug", "info", "warn"].includes(env.LOG_LEVEL)) {
      console.warn("[WARN]", ...args);
    }
  },
  error: (...args: any[]) => {
    console.error("[ERROR]", ...args);
  },
};

// 개발 환경에서만 환경변수 정보 출력
if (isDevelopment) {
  logger.info("🔧 Current environment configuration:", {
    name: appInfo.name,
    version: appInfo.version,
    nodeEnv: env.NODE_ENV,
    apiUrl: env.NEXT_PUBLIC_API_BASE_URL,
    logLevel: env.LOG_LEVEL,
    analytics: appInfo.isAnalyticsEnabled,
  });
}
