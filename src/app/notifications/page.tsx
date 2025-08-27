"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Bell,
  MessageCircle,
  Heart,
  Reply,
  User,
  ArrowLeft,
  Check,
  CheckCheck,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/Button";
import {
  Notification as ApiNotification,
  NotificationKind,
  NotificationResponse,
} from "@/types";
import { notificationsApi } from "@/lib/api";

type FilterType = "all" | NotificationKind;

// 알림 타입별 아이콘 매핑
const getNotificationIcon = (kind: NotificationKind) => {
  switch (kind) {
    case "MENTION":
      return <User className="w-4 h-4 text-blue-500" />;
    case "REACTION":
      return <Heart className="w-4 h-4 text-red-500" />;
    case "REPLY":
      return <Reply className="w-4 h-4 text-green-500" />;
    case "FOLLOW":
      return <User className="w-4 h-4 text-purple-500" />;
    default:
      return <Bell className="w-4 h-4 text-gray-500" />;
  }
};

// 알림 타입별 텍스트 매핑
const getNotificationText = (notification: ApiNotification) => {
  const { kind, payload } = notification;

  switch (kind) {
    case "MENTION":
      return `${payload?.fromUser?.displayName || payload?.fromUser?.handle || "Someone"}님이 회원님을 언급했습니다`;
    case "REACTION":
      return `${payload?.fromUser?.displayName || payload?.fromUser?.handle || "Someone"}님이 회원님의 포스트에 ${payload?.reactionType === "LIKE" ? "좋아요" : "반응"}를 남겼습니다`;
    case "REPLY":
      return `${payload?.fromUser?.displayName || payload?.fromUser?.handle || "Someone"}님이 회원님의 포스트에 답글을 남겼습니다`;
    case "FOLLOW":
      return `${payload?.fromUser?.displayName || payload?.fromUser?.handle || "Someone"}님이 회원님을 팔로우했습니다`;
    default:
      return "새로운 알림이 있습니다";
  }
};

// 알림 타입별 배지 색상
const getNotificationBadge = (kind: NotificationKind) => {
  switch (kind) {
    case "MENTION":
      return "bg-blue-100 text-blue-700 border border-blue-200";
    case "REACTION":
      return "bg-red-100 text-red-700 border border-red-200";
    case "REPLY":
      return "bg-green-100 text-green-700 border border-green-200";
    case "FOLLOW":
      return "bg-purple-100 text-purple-700 border border-purple-200";
    default:
      return "bg-gray-100 text-gray-700 border border-gray-200";
  }
};

// 알림 타입별 라벨
const getNotificationLabel = (kind: NotificationKind) => {
  switch (kind) {
    case "MENTION":
      return "멘션";
    case "REACTION":
      return "반응";
    case "REPLY":
      return "답글";
    case "FOLLOW":
      return "팔로우";
    default:
      return "알림";
  }
};

export default function NotificationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // 알림 목록 쿼리
  const { data, isLoading, error } = useQuery<NotificationResponse>({
    queryKey: ["notifications", activeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeFilter !== "all") {
        params.append("type", activeFilter);
      }
      return notificationsApi.getNotifications(
        params.toString()
      ) as Promise<NotificationResponse>;
    },
    enabled: !!session?.user,
  });

  // 개별 알림 읽음 처리
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      console.log(`Marking notification ${notificationId} as read`);
      const { notificationsApi } = await import("@/lib/api");
      return notificationsApi.markAsRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      // unread-count는 실제 변경이 있을 때만 업데이트하도록 최적화
      // queryClient.invalidateQueries({
      //   queryKey: ["notifications", "unread-count"],
      // });
    },
  });

  // 전체 읽음 처리
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      console.log("Marking all notifications as read");
      const { notificationsApi } = await import("@/lib/api");
      return notificationsApi.markAllAsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      // 전체 읽음 처리 시에만 unread-count 업데이트
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
  });

  const handleNotificationClick = async (notification: ApiNotification) => {
    // 읽지 않은 알림이면 읽음 처리
    if (!notification.readAt) {
      await markAsReadMutation.mutateAsync(notification.id);
    }

    // 관련 포스트로 이동 (payload에서 postId 추출)
    if (notification.payload?.postId) {
      router.push(`/post/${notification.payload.postId}`);
    }
  };

  const NotificationCard = ({
    notification,
  }: {
    notification: ApiNotification;
  }) => (
    <div
      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
        !notification.readAt ? "bg-blue-50/50" : ""
      }`}
      onClick={() => handleNotificationClick(notification)}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getNotificationIcon(notification.kind)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                {notification.payload?.fromUser?.handle
                  ?.charAt(0)
                  .toUpperCase() || "?"}
              </div>
              <span className="text-sm text-gray-600">
                @{notification.payload?.fromUser?.handle || "unknown"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`text-xs px-2 py-1 rounded-full ${getNotificationBadge(notification.kind)}`}
              >
                {getNotificationLabel(notification.kind)}
              </span>
              {!notification.readAt && (
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-800 mb-2">
            {getNotificationText(notification)}
          </p>

          {notification.payload?.postContent && (
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded mb-2">
              {notification.payload.postContent.length > 100
                ? `${notification.payload.postContent.substring(0, 100)}...`
                : notification.payload.postContent}
            </div>
          )}

          <div className="text-xs text-gray-400">
            {new Date(notification.createdAt).toLocaleString("ko-KR")}
          </div>
        </div>
      </div>
    </div>
  );

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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
