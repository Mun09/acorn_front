"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiClient, authApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// 백엔드 로그인 요청 스키마
const LoginRequestSchema = z.object({
  email: z.string().email("유효한 이메일을 입력해주세요"),
  password: z.string().min(6, "비밀번호는 최소 6자리 이상이어야 합니다"),
});

// 백엔드 로그인 응답 스키마
const LoginResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    user: z.object({
      id: z.number(), // string -> number로 변경
      email: z.string(),
      handle: z.string(),
      bio: z.string().nullable(),
      trustScore: z.number(),
      verifiedFlags: z.record(z.boolean()).nullable(), // null 허용
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresIn: z.string(), // number -> string으로 변경
  }),
});

type LoginRequest = z.infer<typeof LoginRequestSchema>;
type LoginResponse = z.infer<typeof LoginResponseSchema>;

export default function LoginForm() {
  const [formData, setFormData] = useState<LoginRequest>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof LoginRequest, string>>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string>("");

  const router = useRouter();
  const queryClient = useQueryClient();

  const validateField = (name: keyof LoginRequest, value: string) => {
    try {
      LoginRequestSchema.shape[name].parse(value);
      setErrors((prev) => ({ ...prev, [name]: "" }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors((prev) => ({ ...prev, [name]: error.errors[0].message }));
      }
    }
  };

  const handleInputChange = (name: keyof LoginRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
    setApiError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setApiError("");

    try {
      // 클라이언트 측 유효성 검사
      const validatedData = LoginRequestSchema.parse(formData);

      // authApi 헬퍼 사용
      const loginResult = await authApi.login(
        validatedData.email,
        validatedData.password
      );

      // 응답 데이터 유효성 검사
      const loginData = LoginResponseSchema.parse(loginResult);

      // Next.js API route를 통해 토큰을 httpOnly 쿠키에 저장
      const sessionResponse = await fetch("/api/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: loginData.data.accessToken,
          refreshToken: loginData.data.refreshToken,
        }),
      });

      if (!sessionResponse.ok) {
        throw new Error("세션 저장에 실패했습니다");
      }

      // React Query 캐시 무효화하여 세션 정보 새로고침
      queryClient.invalidateQueries({ queryKey: ["session"] });

      // 홈으로 리다이렉트
      router.push("/");
    } catch (error) {
      console.error("Login error:", error);

      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof LoginRequest, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof LoginRequest] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError("로그인 중 오류가 발생했습니다");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground">로그인</h2>
        <p className="mt-2 text-muted-foreground">계정에 로그인하세요</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="이메일"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              error={errors.email}
              disabled={isLoading}
              className="w-full"
            />
          </div>

          <div>
            <Input
              type="password"
              placeholder="비밀번호"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              error={errors.password}
              disabled={isLoading}
              className="w-full"
            />
          </div>
        </div>

        {apiError && (
          <div className="text-destructive text-sm text-center">{apiError}</div>
        )}

        <div>
          <Button
            type="submit"
            className="w-full"
            loading={isLoading}
            disabled={isLoading}
          >
            로그인
          </Button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="text-primary hover:text-primary/80 text-sm"
          >
            계정이 없으신가요? 회원가입
          </button>
        </div>
      </form>
    </div>
  );
}
