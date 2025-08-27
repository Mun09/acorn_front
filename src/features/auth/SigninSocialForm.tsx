// app/(auth)/_components/SigninSocialForm.tsx
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

export function SigninSocialForm() {
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();
  const router = useRouter();

  const finalize = async () => {
    await qc.invalidateQueries({ queryKey: ["session"] });
    await qc.refetchQueries({ queryKey: ["session"] });
    router.push("/");
  };

  const doSignin = async (provider: "google" | "github") => {
    try {
      setApiError("");
      setLoading(true);

      const providerInstance =
        provider === "google"
          ? new GoogleAuthProvider()
          : new GithubAuthProvider();

      const cred = await signInWithPopup(auth, providerInstance);
      const idToken = await cred.user.getIdToken(true);

      // 세션 쿠키 생성 (로그인 시에도 동일)
      await authApi.createSessionCookie(idToken);

      await finalize();
    } catch (e: any) {
      if (e?.code === "auth/popup-closed-by-user") {
        setApiError("팝업이 닫혀서 인증이 취소되었습니다");
      } else if (e?.code === "auth/account-exists-with-different-credential") {
        setApiError("같은 이메일이 다른 로그인 방식과 연결되어 있습니다");
      } else if (e?.code === "auth/cancelled-popup-request") {
        setApiError("이미 열려있는 인증 팝업이 있습니다. 잠시 후 시도해주세요");
      } else if (e?.code === "auth/unauthorized-domain") {
        setApiError(
          "허용되지 않은 도메인에서의 요청입니다(Firebase 콘솔 확인 필요)"
        );
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
          onClick={() => doSignin("google")}
          disabled={loading}
        >
          구글로 계속하기
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-1/2"
          onClick={() => doSignin("github")}
          disabled={loading}
        >
          GitHub로 계속하기
        </Button>
      </div>
    </div>
  );
}
