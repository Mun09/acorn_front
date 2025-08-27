"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { auth } from "@/lib/firebaseClient";
import {
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
} from "firebase/auth";
import { authApi } from "@/lib/api";

export function SignupSocialForm({
  handle,
  handleError,
}: {
  handle: string;
  handleError?: string;
}) {
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();
  const router = useRouter();

  const finalize = async () => {
    await qc.invalidateQueries({ queryKey: ["session"] });
    router.push("/");
  };

  const doSignup = async (provider: "google" | "github") => {
    try {
      setApiError("");
      setLoading(true);

      if (!handle || handleError) {
        setApiError(handleError || "핸들을 입력해주세요");
        return;
      }

      const providerInstance =
        provider === "google"
          ? new GoogleAuthProvider()
          : new GithubAuthProvider();

      const cred = await signInWithPopup(auth, providerInstance);
      const idToken = await cred.user.getIdToken(true);

      await authApi.createSessionCookie(idToken);
      await authApi.signup(idToken, handle);

      await finalize();
    } catch (e: any) {
      if (e?.code === "auth/popup-closed-by-user") {
        setApiError("팝업이 닫혀서 인증이 취소되었습니다");
      } else if (e?.code === "auth/account-exists-with-different-credential") {
        setApiError("이미 다른 제공자 계정과 연결된 이메일입니다");
      } else {
        setApiError(e?.message || "소셜 로그인 중 오류가 발생했습니다");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {apiError && (
        <div className="text-destructive text-sm text-center">{apiError}</div>
      )}

      <div className="flex gap-3 justify-center">
        <Button
          type="button"
          variant="outline"
          className="w-1/2"
          onClick={() => doSignup("google")}
          disabled={loading}
        >
          구글로 계속하기
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-1/2"
          onClick={() => doSignup("github")}
          disabled={loading}
        >
          GitHub로 계속하기
        </Button>
      </div>
    </div>
  );
}
