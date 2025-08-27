// app/(auth)/signin/SigninForm.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SigninEmailForm } from "./SigninEmailForm";
import { SigninSocialForm } from "./SigninSocialForm";

export default function SigninForm() {
  const [mode, setMode] = useState<"email" | "social">("email");

  return (
    <div className="max-w-md mx-auto space-y-8">
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-3xl font-bold">로그인</h2>
        <p className="mt-2 text-muted-foreground">계정에 접속하세요</p>
      </div>

      {/* 모드 선택 */}
      <div className="flex justify-center gap-3">
        <Button
          type="button"
          variant={mode === "email" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("email")}
        >
          이메일 로그인
        </Button>
        <Button
          type="button"
          variant={mode === "social" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("social")}
        >
          소셜 로그인
        </Button>
      </div>

      {/* 본문 */}
      {mode === "email" ? <SigninEmailForm /> : <SigninSocialForm />}
    </div>
  );
}
