"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { auth } from "@/lib/firebaseClient";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { authApi } from "@/lib/api";

const EmailSchema = z.object({
  email: z.string().email("유효한 이메일"),
  password: z.string().min(6, "최소 6자"),
  confirmPassword: z.string(),
});

export function SignupEmailForm({
  handle,
  handleError,
}: {
  handle: string;
  handleError?: string;
}) {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
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

  const assertPasswordMatch = (v: typeof form) => {
    if (v.password !== v.confirmPassword) {
      throw new z.ZodError([
        {
          code: "custom",
          path: ["confirmPassword"],
          message: "비밀번호가 일치하지 않습니다",
        } as any,
      ]);
    }
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
      if (!handle || handleError) {
        setErrors((e) => ({
          ...e,
          handle: handleError || "핸들을 확인해주세요",
        }));
        throw new Error("Invalid handle");
      }

      const parsed = EmailSchema.parse(form);
      assertPasswordMatch(parsed);

      // Firebase 계정 생성
      const cred = await createUserWithEmailAndPassword(
        auth,
        parsed.email,
        parsed.password
      );
      const idToken = await cred.user.getIdToken(true);

      // 세션 쿠키 생성 + 서비스 DB 가입 (핸들 확정)
      await authApi.createSessionCookie(idToken);
      await authApi.signup(idToken, handle);

      await finalize();
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const f: Record<string, string> = {};
        err.errors.forEach((e) => (f[String(e.path[0])] = e.message));
        setErrors(f);
      } else if (err?.code === "auth/email-already-in-use") {
        setErrors((p) => ({ ...p, email: "이미 사용 중인 이메일입니다" }));
      } else if (err?.code === "auth/invalid-email") {
        setErrors((p) => ({ ...p, email: "유효하지 않은 이메일 형식입니다" }));
      } else if (err?.code === "auth/weak-password") {
        setErrors((p) => ({ ...p, password: "비밀번호가 너무 약합니다" }));
      } else if (err?.message !== "Invalid handle") {
        setApiError(err?.message || "회원가입 중 오류가 발생했습니다");
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
      <Input
        type="password"
        placeholder="비밀번호 확인"
        value={form.confirmPassword}
        onChange={(e) => setField("confirmPassword", e.target.value)}
        error={errors.confirmPassword}
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
        이메일로 회원가입
      </Button>
    </form>
  );
}
