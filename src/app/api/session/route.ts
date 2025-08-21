import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/lib/config";

const BACKEND_URL = env.NEXT_PUBLIC_API_BASE_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, refreshToken } = body;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token is required" },
        { status: 400 }
      );
    }

    // Set httpOnly cookies
    const cookieStore = cookies();

    cookieStore.set("acorn_token", accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    if (refreshToken) {
      cookieStore.set("acorn_refresh_token", refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Session store error:", error);
    return NextResponse.json(
      { error: "Failed to store session" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = cookies();

    // Get refresh token for backend logout
    const refreshToken = cookieStore.get("acorn_refresh_token")?.value;

    // Call backend logout if refresh token exists
    if (refreshToken) {
      try {
        await fetch(`${BACKEND_URL}/api/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (error) {
        console.error("Backend logout error:", error);
        // Continue with local logout even if backend fails
      }
    }

    // Clear cookies
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Session clear error:", error);
    return NextResponse.json(
      { error: "Failed to clear session" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get("acorn_token")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

    // Call backend to verify token and get user info
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // Token might be expired, try to refresh
      const refreshToken = cookieStore.get("acorn_refresh_token")?.value;

      if (refreshToken) {
        try {
          const refreshResponse = await fetch(
            `${BACKEND_URL}/api/auth/refresh`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ refreshToken }),
            }
          );

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();

            // Update access token cookie
            cookieStore.set("acorn_token", refreshData.data.accessToken, {
              httpOnly: true,
              secure: env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 7, // 7 days
            });

            // Retry getting user info with new token
            const retryResponse = await fetch(`${BACKEND_URL}/api/auth/me`, {
              headers: {
                Authorization: `Bearer ${refreshData.data.accessToken}`,
                "Content-Type": "application/json",
              },
            });

            if (retryResponse.ok) {
              const userData = await retryResponse.json();
              return NextResponse.json(userData);
            }
          }
        } catch (refreshError) {
          console.error("Token refresh error:", refreshError);
        }
      }

      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const userData = await response.json();
    return NextResponse.json(userData);
  } catch (error) {
    console.error("Session get error:", error);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    );
  }
}
