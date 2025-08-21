"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiClient, authApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// 백엔드 회원가입 요청 스키마
const SignupRequestSchema = z
  .object({
    email: z.string().email("유효한 이메일을 입력해주세요"),
    handle: z
      .string()
      .min(3, "핸들은 최소 3자리 이상이어야 합니다")
      .max(20, "핸들은 최대 20자리까지 입력 가능합니다")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "핸들은 영문, 숫자, 언더스코어만 사용 가능합니다"
      ),
    password: z.string().min(6, "비밀번호는 최소 6자리 이상이어야 합니다"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  });

// 백엔드 회원가입 응답 스키마
const SignupResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    user: z.object({
      id: z.number(),
      email: z.string(),
      handle: z.string(),
      bio: z.string().nullable(),
      trustScore: z.number(),
      verifiedFlags: z.record(z.boolean()).nullable(),
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresIn: z.string(),
  }),
});

type SignupRequest = z.infer<typeof SignupRequestSchema>;
type SignupResponse = z.infer<typeof SignupResponseSchema>;

export default function SignupForm() {
  const [formData, setFormData] = useState<SignupRequest>({
    email: "",
    handle: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof SignupRequest, string>>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string>("");

  const router = useRouter();
  const queryClient = useQueryClient();

  const validateField = (name: keyof SignupRequest, value: string) => {
    try {
      setErrors((prev) => ({ ...prev, [name]: "" }));

      // 개별 필드별 검증
      switch (name) {
        case "email":
          z.string().email("유효한 이메일을 입력해주세요").parse(value);
          break;
        case "handle":
          z.string()
            .min(3, "핸들은 최소 3자리 이상이어야 합니다")
            .max(20, "핸들은 최대 20자리까지 입력 가능합니다")
            .regex(
              /^[a-zA-Z0-9_]+$/,
              "핸들은 영문, 숫자, 언더스코어만 사용 가능합니다"
            )
            .parse(value);
          break;
        case "password":
          z.string()
            .min(6, "비밀번호는 최소 6자리 이상이어야 합니다")
            .parse(value);
          break;
        case "confirmPassword":
          if (formData.password && value && formData.password !== value) {
            throw new Error("비밀번호가 일치하지 않습니다");
          }
          break;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors((prev) => ({ ...prev, [name]: error.errors[0].message }));
      } else if (error instanceof Error) {
        setErrors((prev) => ({ ...prev, [name]: error.message }));
      }
    }
  };

  const handleInputChange = (name: keyof SignupRequest, value: string) => {
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
      const validatedData = SignupRequestSchema.parse(formData);

      // confirmPassword는 백엔드에 보내지 않음
      const { confirmPassword, ...signupData } = validatedData;

      // authApi 헬퍼 사용
      const signupResult = await authApi.signup(
        signupData.email,
        signupData.handle,
        signupData.password
      );

      // 응답 데이터 유효성 검사
      const validatedResult = SignupResponseSchema.parse(signupResult);

      // Next.js API route를 통해 토큰을 httpOnly 쿠키에 저장
      const sessionResponse = await fetch("/api/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: validatedResult.data.accessToken,
          refreshToken: validatedResult.data.refreshToken,
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
      console.error("Signup error:", error);

      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof SignupRequest, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof SignupRequest] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError("회원가입 중 오류가 발생했습니다");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground">회원가입</h2>
        <p className="mt-2 text-muted-foreground">새 계정을 만드세요</p>
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
              type="text"
              placeholder="핸들 (사용자명)"
              value={formData.handle}
              onChange={(e) => handleInputChange("handle", e.target.value)}
              error={errors.handle}
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

          <div>
            <Input
              type="password"
              placeholder="비밀번호 확인"
              value={formData.confirmPassword}
              onChange={(e) =>
                handleInputChange("confirmPassword", e.target.value)
              }
              error={errors.confirmPassword}
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
            회원가입
          </Button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-primary hover:text-primary/80 text-sm"
          >
            이미 계정이 있으신가요? 로그인
          </button>
        </div>
      </form>
    </div>
  );
}
