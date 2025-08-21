// API 사용 예시 컴포넌트

"use client";

import { useState } from "react";
import { z } from "zod";
import {
  apiClient,
  authApi,
  postsApi,
  tokenManager,
  useApiUnauthorizedHandler,
} from "@/lib/api";

// API 응답 스키마 예시
const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  handle: z.string(),
  name: z.string().optional(),
  createdAt: z.string(),
});

const PostSchema = z.object({
  id: z.number(),
  text: z.string(),
  authorId: z.number(),
  createdAt: z.string(),
  author: UserSchema,
});

const FeedSchema = z.object({
  posts: z.array(PostSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
  }),
});

type User = z.infer<typeof UserSchema>;
type Post = z.infer<typeof PostSchema>;
type Feed = z.infer<typeof FeedSchema>;

export default function ApiDemo() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 401 처리 훅 사용
  useApiUnauthorizedHandler();

  // 로그인 예시
  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      // 로그인 응답 스키마
      const LoginResponseSchema = z.object({
        token: z.string(),
        user: UserSchema,
      });

      // 스키마와 함께 로그인
      const response = await apiClient.post(
        "/api/auth/login",
        {
          email: "user@example.com",
          password: "password",
        },
        LoginResponseSchema
      );

      // 토큰 저장
      tokenManager.setToken(response.token);
      setUser(response.user);

      console.log("로그인 성공:", response);
    } catch (err: any) {
      setError(err.message || "로그인 실패");
      console.error("로그인 오류:", err);
    } finally {
      setLoading(false);
    }
  };

  // 사용자 정보 가져오기 (스키마 검증 포함)
  const handleGetMe = async () => {
    try {
      setLoading(true);
      setError(null);

      // Zod 스키마로 응답 검증
      const userData = await apiClient.get("/api/auth/me", UserSchema);
      setUser(userData);

      console.log("사용자 정보:", userData);
    } catch (err: any) {
      setError(err.message || "사용자 정보 로드 실패");
      console.error("사용자 정보 오류:", err);
    } finally {
      setLoading(false);
    }
  };

  // 피드 가져오기 (스키마 검증 포함)
  const handleGetFeed = async () => {
    try {
      setLoading(true);
      setError(null);

      // Zod 스키마로 응답 검증
      const feedData = await apiClient.get(
        "/api/posts?page=1&limit=20",
        FeedSchema
      );
      setPosts(feedData.posts);

      console.log("피드 데이터:", feedData);
    } catch (err: any) {
      setError(err.message || "피드 로드 실패");
      console.error("피드 오류:", err);
    } finally {
      setLoading(false);
    }
  };

  // 포스트 생성
  const handleCreatePost = async () => {
    try {
      setLoading(true);
      setError(null);

      const newPost = await postsApi.createPost("새로운 포스트입니다! 🌰");
      console.log("포스트 생성:", newPost);

      // 피드 새로고침
      handleGetFeed();
    } catch (err: any) {
      setError(err.message || "포스트 생성 실패");
      console.error("포스트 생성 오류:", err);
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    try {
      await authApi.logout();
      tokenManager.clearToken();
      setUser(null);
      setPosts([]);
      console.log("로그아웃 완료");
    } catch (err: any) {
      console.error("로그아웃 오류:", err);
      // 로그아웃은 실패해도 토큰은 삭제
      tokenManager.clearToken();
      setUser(null);
      setPosts([]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">🌰 Acorn API Demo</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleLogin}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded transition-colors"
        >
          {loading ? "로딩..." : "로그인 테스트"}
        </button>

        <button
          onClick={handleGetMe}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded transition-colors"
        >
          {loading ? "로딩..." : "내 정보"}
        </button>

        <button
          onClick={handleGetFeed}
          disabled={loading}
          className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-4 py-2 rounded transition-colors"
        >
          {loading ? "로딩..." : "피드 로드"}
        </button>

        <button
          onClick={handleCreatePost}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-4 py-2 rounded transition-colors"
        >
          {loading ? "로딩..." : "포스트 생성"}
        </button>

        <button
          onClick={handleLogout}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded transition-colors col-span-2"
        >
          로그아웃
        </button>
      </div>

      {user && (
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold text-gray-900 mb-2">현재 사용자</h3>
          <pre className="text-sm text-gray-600">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      )}

      {posts.length > 0 && (
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold text-gray-900 mb-2">
            피드 ({posts.length}개 포스트)
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {posts.map((post) => (
              <div key={post.id} className="bg-white p-3 rounded border">
                <p className="text-gray-900">{post.text}</p>
                <p className="text-sm text-gray-500 mt-1">
                  by @{post.author.handle} •{" "}
                  {new Date(post.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded">
        <h3 className="font-semibold text-blue-900 mb-2">💡 API 사용법</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>
            • <code>apiClient.get/post/patch/delete</code>로 직접 호출
          </p>
          <p>• Zod 스키마를 두 번째 매개변수로 전달하면 응답 검증</p>
          <p>
            • 쿠키의 <code>acorn_token</code>이 자동으로 Authorization 헤더에
            추가
          </p>
          <p>• 401 응답 시 자동으로 토큰 삭제 후 /login으로 리다이렉트</p>
          <p>
            • <code>useApiUnauthorizedHandler()</code> 훅으로 401 처리 활성화
          </p>
        </div>
      </div>
    </div>
  );
}
