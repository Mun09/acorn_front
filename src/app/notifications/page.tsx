// NotificationsPage.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Bell, ArrowLeft, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/Button";
import {
  Notification as ApiNotification,
  NotificationKind,
  NotificationResponse,
} from "@/types/notification";
import { notificationsApi } from "@/lib/api";
import { NotificationCard } from "@/features/notifications/NotificationCard";

type FilterType = "all" | NotificationKind;

export default function NotificationsPage() {
  const { data: session, isLoading: isSessionLoading } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const { data, isLoading, error } = useQuery<NotificationResponse>({
    queryKey: ["notifications", activeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeFilter !== "all") {
        params.append("type", activeFilter);
      }
      const response = notificationsApi.getNotifications(
        params.toString()
      ) as Promise<NotificationResponse>;
      return response;
    },
    enabled: !!session?.user,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const { notificationsApi } = await import("@/lib/api");
      return notificationsApi.markAsRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return notificationsApi.markAllAsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
  });

  const handleNotificationClick = async (notification: ApiNotification) => {
    // 읽음 처리
    if (!notification.readAt) {
      await markAsReadMutation.mutateAsync(notification.id);
    }

    // 이동 로직
    const payload: any = notification.payload;

    if (payload?.postId) {
      router.push(`/post/${payload.postId}`);
      return;
    }

    if (notification.kind === "SYSTEM") {
      if (payload?.linkUrl) {
        // 공지 상세 페이지 링크가 있으면 해당 링크로
        router.push(payload.linkUrl);
        return;
      }
      // 링크가 없으면 공지 모아보기 등으로 fallback
      router.push("/notices");
      return;
    }
  };

  if (isSessionLoading) return null;

  if (!session?.user) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="text-center py-12">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            로그인이 필요합니다
          </h2>
          <p className="text-gray-600 mb-4">
            알림을 확인하려면 로그인해주세요.
          </p>
          <Link href="/login">
            <Button>로그인</Button>
          </Link>
        </div>
      </div>
    );
  }

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "전체" },
    { key: "MENTION", label: "멘션" },
    { key: "REACTION", label: "반응" },
    { key: "REPLY", label: "답글" },
    { key: "FOLLOW", label: "팔로우" },
    { key: "SYSTEM", label: "공지" },
  ];

  const unreadCount = data?.notifications.filter((n) => !n.readAt).length || 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* 헤더 */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">알림</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              모두 읽음
            </Button>
          )}
        </div>

        {/* 필터 탭 */}
        <div className="flex space-x-1 mt-4 overflow-x-auto">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === filter.key
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* 알림 목록 */}
      <div className="bg-white">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-500 mt-2">알림을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              알림을 불러올 수 없습니다
            </h3>
            <p className="text-gray-600">잠시 후 다시 시도해주세요.</p>
          </div>
        ) : !data?.notifications.length ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeFilter === "all"
                ? "알림이 없습니다"
                : `${filters.find((f) => f.key === activeFilter)?.label} 알림이 없습니다`}
            </h3>
            <p className="text-gray-600">
              새로운 알림이 있으면 여기에 표시됩니다.
            </p>
          </div>
        ) : (
          <div>
            {data.notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onClick={handleNotificationClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
