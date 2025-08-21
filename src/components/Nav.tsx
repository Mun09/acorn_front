"use client";

import Link from "next/link";
import { useSession, useLogout } from "@/hooks/useSession";
import { useTheme } from "next-themes";
import { useState } from "react";
import {
  Search,
  Bell,
  User,
  Moon,
  Sun,
  LogOut,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Nav() {
  const { data: session, isLoading } = useSession();
  const logout = useLogout();
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logout.mutate();
    setShowUserMenu(false);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* 좌측: 로고 + 모바일 메뉴 버튼 */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 rounded-md hover:bg-accent"
            >
              {showMobileMenu ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">
                  A
                </span>
              </div>
              <span className="font-bold text-xl text-foreground">Acorn</span>
            </Link>
          </div>

          {/* 중앙: 검색바 */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
          </div>

          {/* 우측: 테마 토글 + 사용자 메뉴 */}
          <div className="flex items-center space-x-2">
            {/* 테마 토글 */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-accent"
              aria-label="테마 변경"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {isLoading ? (
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
            ) : session?.isAuthenticated ? (
              <>
                {/* 알림 버튼 */}
                <button className="p-2 rounded-full hover:bg-accent relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* 프로필 메뉴 */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-2 rounded-full hover:bg-accent"
                  >
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="hidden md:block font-medium">
                      @{session.user.handle}
                    </span>
                  </button>

                  {/* 드롭다운 메뉴 */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-md shadow-lg py-1 z-50">
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm hover:bg-accent"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="w-4 h-4 mr-2" />
                        프로필
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center px-4 py-2 text-sm hover:bg-accent"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        설정
                      </Link>
                      <hr className="my-1 border-border" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm hover:bg-accent text-red-600"
                        disabled={logout.isPending}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        {logout.isPending ? "로그아웃 중..." : "로그아웃"}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    로그인
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">회원가입</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 오버레이 */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 top-16 bg-background/95 backdrop-blur-sm z-40">
          <div className="p-4">
            {/* 모바일 네비게이션 링크들은 Sidebar 컴포넌트에서 처리 */}
          </div>
        </div>
      )}
    </nav>
  );
}
