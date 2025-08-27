"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SignupEmailForm } from "./SignupEmailForm";
import { SignupSocialForm } from "./SignupSocialForm";
import { z } from "zod";
import { cn } from "@/lib/utils";

const HandleSchema = z
  .string()
  .min(3, "핸들은 최소 3자")
  .max(20, "최대 20자")
  .regex(/^[a-zA-Z0-9_]+$/, "영문/숫자/_ 만 가능합니다");

export default function SignupForm() {
  const [mode, setMode] = useState<"email" | "social">("email");
  const [handle, setHandle] = useState("");
  const [handleError, setHandleError] = useState("");

  const setHandleSafe = (v: string) => {
    setHandle(v);
    setHandleError("");
    const res = HandleSchema.safeParse(v);
    if (!res.success)
      setHandleError(res.error.errors[0]?.message ?? "핸들을 확인해주세요");
  };

  return (
    <div className="max-w-md mx-auto space-y-8">
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-3xl font-bold">회원가입</h2>
        <p className="mt-2 text-muted-foreground">새 계정을 만드세요</p>
      </div>

      {/* 모드 선택 (중앙 정렬) */}
      <div className="flex justify-center gap-3">
        <Button
          type="button"
          variant={mode === "email" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("email")}
        >
          이메일로 가입
        </Button>
        <Button
          type="button"
          variant={mode === "social" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("social")}
        >
          소셜로 가입
        </Button>
      </div>

      {/* 공통: 핸들 입력 (두 모드에서 모두 사용) */}
      <div>
        <Input
          type="text"
          placeholder="핸들 (사용자명)"
          value={handle}
          onChange={(e) => setHandleSafe(e.target.value)}
          error={handleError}
          className="w-full"
        />
      </div>

      {/* 본문: 모드별 폼 */}
      {mode === "email" ? (
        <SignupEmailForm handle={handle} handleError={handleError} />
      ) : (
        <SignupSocialForm handle={handle} handleError={handleError} />
      )}
    </div>
  );
}
