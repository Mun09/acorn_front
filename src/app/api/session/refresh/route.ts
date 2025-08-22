import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/lib/config";

const BACKEND_URL = env.NEXT_PUBLIC_API_BASE_URL;

export async function POST() {
  try {
    const cookieStore = cookies();
    const refreshToken = cookieStore.get("acorn_refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token not found" },
        { status: 401 }
      );
    }

    // 백엔드에 토큰 갱신 요청
    const response = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      // Refresh token이 만료된 경우 쿠키 삭제
      cookieStore.set("acorn_token", "", {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
      });

      cookieStore.set("acorn_refresh_token", "", {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
      });

      return NextResponse.json(
        { error: "Refresh token expired" },
        { status: 401 }
      );
    }

    const data = await response.json();

    // 새로운 access token을 쿠키에 저장
    cookieStore.set("acorn_token", data.data.accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // 새로운 refresh token이 있다면 업데이트
    if (data.data.refreshToken) {
      cookieStore.set("acorn_refresh_token", data.data.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 500 }
    );
  }
}
