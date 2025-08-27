"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { auth } from "@/lib/firebaseClient";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
} from "firebase/auth";

// 폼 유효성 (그대로 사용)
const LoginRequestSchema = z.object({
  email: z.string().email("유효한 이메일을 입력해주세요"),
  password: z.string().min(6, "비밀번호는 최소 6자리 이상이어야 합니다"),
});
type LoginRequest = z.infer<typeof LoginRequestSchema>;

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

  // ★ 공통: Firebase ID 토큰을 우리 백엔드 세션으로 교환 → httpOnly 쿠키 저장
  async function establishSessionWithBackend(idToken: string) {
    // (권장) 우리 백엔드의 /auth/session에 Bearer로 보내서 서비스용 JWT 발급
    const sessionResp = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/session`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      }
    );
    if (!sessionResp.ok) {
      const t = await sessionResp.text();
      throw new Error(`세션 발급 실패: ${t || sessionResp.status}`);
    }
    const data = await sessionResp.json();

    // Next API에서 httpOnly 쿠키에 저장 (기존 흐름 유지)
    const saveCookieResp = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessToken: data?.data?.accessToken,
        refreshToken: data?.data?.refreshToken,
        expiresIn: data?.data?.expiresIn,
      }),
    });
    if (!saveCookieResp.ok) throw new Error("세션 저장에 실패했습니다");
  }

  // 이메일/비밀번호 로그인(Firebase)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setApiError("");

    try {
      const validated = LoginRequestSchema.parse(formData);
      const cred = await signInWithEmailAndPassword(
        auth,
        validated.email,
        validated.password
      );
      const idToken = await cred.user.getIdToken(/* forceRefresh */ true);

      await establishSessionWithBackend(idToken);

      // 세션 갱신
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      router.push("/");
    } catch (error: any) {
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof LoginRequest, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0])
            fieldErrors[err.path[0] as keyof LoginRequest] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        setApiError(error?.message || "로그인 중 오류가 발생했습니다");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 소셜 로그인 (Google)
  const handleGoogle = async () => {
    setIsLoading(true);
    setApiError("");
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const idToken = await cred.user.getIdToken(true);
      await establishSessionWithBackend(idToken);
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      router.push("/");
    } catch (e: any) {
      console.error(e);
      setApiError(e?.message || "구글 로그인 실패");
    } finally {
      setIsLoading(false);
    }
  };

  // 소셜 로그인 (GitHub)
  const handleGitHub = async () => {
    setIsLoading(true);
    setApiError("");
    try {
      const provider = new GithubAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const idToken = await cred.user.getIdToken(true);
      await establishSessionWithBackend(idToken);
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      router.push("/");
    } catch (e: any) {
      console.error(e);
      setApiError(e?.message || "GitHub 로그인 실패");
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
          <Input
            type="email"
            placeholder="이메일"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            error={errors.email}
            disabled={isLoading}
            className="w-full"
          />
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

        {apiError && (
          <div className="text-destructive text-sm text-center">{apiError}</div>
        )}

        <Button
          type="submit"
          className="w-full"
          loading={isLoading}
          disabled={isLoading}
        >
          이메일로 로그인
        </Button>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="w-1/2"
            onClick={handleGoogle}
            disabled={isLoading}
          >
            구글로 계속하기
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-1/2"
            onClick={handleGitHub}
            disabled={isLoading}
          >
            GitHub로 계속하기
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
