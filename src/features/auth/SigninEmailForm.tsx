// app/(auth)/_components/SigninEmailForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { auth } from "@/lib/firebaseClient";
import { signInWithEmailAndPassword } from "firebase/auth";
import { authApi } from "@/lib/api";

const EmailSchema = z.object({
  email: z.string().email("유효한 이메일"),
  password: z.string().min(6, "최소 6자"),
});

export function SigninEmailForm() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const qc = useQueryClient();
  const router = useRouter();

  const setField = (name: keyof typeof form, value: string) => {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((e) => ({ ...e, [name]: "" }));
    setApiError("");
  };

  const finalize = async () => {
    await qc.invalidateQueries({ queryKey: ["session"] });
    router.push("/");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setApiError("");
    setErrors({});

    try {
      const parsed = EmailSchema.parse(form);

      // Firebase 이메일/비번 로그인
      const cred = await signInWithEmailAndPassword(
        auth,
        parsed.email,
        parsed.password
      );
      const idToken = await cred.user.getIdToken(true);

      // 세션 쿠키 생성 (백엔드)
      await authApi.createSessionCookie(idToken);

      await finalize();
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const f: Record<string, string> = {};
        err.errors.forEach((e) => (f[String(e.path[0])] = e.message));
        setErrors(f);
      } else if (err?.code === "auth/invalid-email") {
        setErrors((p) => ({ ...p, email: "유효하지 않은 이메일 형식입니다" }));
      } else if (err?.code === "auth/user-disabled") {
        setApiError("비활성화된 계정입니다");
      } else if (err?.code === "auth/user-not-found") {
        setApiError("가입되지 않은 이메일입니다");
      } else if (err?.code === "auth/wrong-password") {
        setErrors((p) => ({ ...p, password: "비밀번호가 올바르지 않습니다" }));
      } else if (err?.code === "auth/too-many-requests") {
        setApiError("요청이 너무 많습니다. 잠시 후 다시 시도해주세요");
      } else {
        setApiError(err?.message || "로그인 중 오류가 발생했습니다");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <Input
        type="email"
        placeholder="이메일"
        value={form.email}
        onChange={(e) => setField("email", e.target.value)}
        error={errors.email}
        disabled={loading}
        className="w-full"
      />
      <Input
        type="password"
        placeholder="비밀번호"
        value={form.password}
        onChange={(e) => setField("password", e.target.value)}
        error={errors.password}
        disabled={loading}
        className="w-full"
      />

      {apiError && (
        <div className="text-destructive text-sm text-center">{apiError}</div>
      )}

      <Button
        type="submit"
        className="w-full"
        loading={loading}
        disabled={loading}
      >
        로그인
      </Button>

      {/* 선택: 비밀번호 재설정 페이지 라우팅 버튼 */}
      {/* <Button type="button" variant="ghost" className="w-full" onClick={() => router.push("/reset-password")}>
        비밀번호를 잊으셨나요?
      </Button> */}
    </form>
  );
}
