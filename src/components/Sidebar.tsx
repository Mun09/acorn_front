"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { useQuery } from "@tanstack/react-query";
import {
  Home,
  TrendingUp,
  Bell,
  User,
  Settings,
  Bookmark,
  MessageCircle,
  Hash,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import acornIcon from "@/assets/icon.png"; // page.tsx 기준 상대 경로
import { notificationsApi } from "@/lib/api";

interface SidebarItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: number;
  requireAuth?: boolean;
}

const sidebarItems: SidebarItem[] = [
  {
    icon: Home,
    label: "홈",
    href: "/",
  },
  {
    icon: Search,
    label: "검색",
    href: "/search",
  },
  {
    icon: Hash,
    label: "Symbols",
    href: "/symbols",
  },
  {
    icon: TrendingUp,
    label: "Trending",
    href: "/trending",
  },
  {
    icon: Bell,
    label: "Notifications",
    href: "/notifications",
    requireAuth: true,
  },
  // {
  //   icon: MessageCircle,
  //   label: "Messages",
  //   href: "/messages",
  //   requireAuth: true,
  // },
  {
    icon: Bookmark,
    label: "Bookmarks",
    href: "/bookmarks",
    requireAuth: true,
  },
  {
    icon: User,
    label: "Profile",
    href: "/profile",
    requireAuth: true,
  },
  {
    icon: Settings,
    label: "Settings",
    href: "/settings",
    requireAuth: true,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session, isLoading } = useSession();

  // Get unread notifications count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const data = await notificationsApi.getUnreadCount();
      return (data as any).count;
    },
    enabled: !!session?.isAuthenticated,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  // 인증이 필요한 페이지들은 비로그인 시 숨김
  const filteredItems = sidebarItems.filter((item) => {
    if (item.requireAuth && !session?.isAuthenticated) {
      return false;
    }
    return true;
  });

  return (
    <>
      {/* 데스크톱 사이드바 */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-64">
        <div className="flex flex-col h-full bg-background border-r border-border">
          {/* 로고 영역 */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-border">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src={acornIcon}
                alt="ACORN 아이콘"
                width={32}
                height={32}
                // placeholder="blur" // 이미지를 불러오는 동안 흐릿하게 표시 (선택 사항)
              />
              <span className="text-xl font-bold text-foreground">Acorn</span>
            </Link>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.href === "/notifications" && unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                  {item.badge && item.href !== "/notifications" && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 사이드바 하단 */}
          {session?.isAuthenticated && session.user && (
            <div className="p-4 border-t border-border">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/50">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    @{session.user.handle}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {session.user.email}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* 모바일 하단 네비게이션 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t border-border">
        <nav className="flex justify-around py-2">
          {filteredItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors relative",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
                {item.href === "/notifications" && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
                {item.badge && item.href !== "/notifications" && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
