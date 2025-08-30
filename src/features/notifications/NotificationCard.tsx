"use client";

import { Bell, Heart, Reply, User } from "lucide-react";
import {
  Notification as ApiNotification,
  NotificationKind,
} from "@/types/notification";

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
    case "SYSTEM":
      return <Bell className="w-4 h-4 text-amber-500" />;
    default:
      return <Bell className="w-4 h-4 text-gray-500" />;
  }
};

const getNotificationText = (notification: ApiNotification) => {
  const { kind, payload } = notification as any;

  switch (kind) {
    case "MENTION":
      return `${payload.fromHandle || "Someone"}님이 회원님을 언급했습니다`;
    case "REACTION":
      return (
        payload.message ||
        `${payload.fromHandle || "Someone"}님이 회원님의 포스트에 ${
          payload.reactionType === "LIKE" ? "좋아요" : "반응"
        }를 남겼습니다`
      );
    case "REPLY":
      return `${payload.fromHandle || "Someone"}님이 회원님의 포스트에 답글을 남겼습니다`;
    case "FOLLOW":
      return `${payload.fromHandle || "Someone"}님이 회원님을 팔로우했습니다`;
    case "SYSTEM":
      // 시스템 공지: title이 있으면 우선, 없으면 message 사용
      return payload.title || payload.message || "시스템 공지";
    default:
      return "새로운 알림이 있습니다";
  }
};

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
    case "SYSTEM":
      return "bg-amber-100 text-amber-700 border border-amber-200";
    default:
      return "bg-gray-100 text-gray-700 border border-gray-200";
  }
};

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
    case "SYSTEM":
      return "공지";
    default:
      return "알림";
  }
};

export function NotificationCard({
  notification,
  onClick,
}: {
  notification: ApiNotification;
  onClick?: (n: ApiNotification) => void;
}) {
  const handleClick = () => {
    onClick?.(notification);
  };

  // 아바타 이니셜
  const initial =
    (notification.payload as any)?.fromHandle?.charAt(0)?.toUpperCase() ??
    (notification.kind === "SYSTEM" ? "!" : "?");

  const subtitleHandle =
    (notification.payload as any)?.fromHandle ??
    (notification.kind === "SYSTEM" ? "system" : "unknown");

  const postContent = (notification.payload as any)?.postContent as
    | string
    | undefined;

  return (
    <div
      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
        !notification.readAt ? "bg-blue-50/50" : ""
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getNotificationIcon(notification.kind)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                {initial}
              </div>
              <span className="text-sm text-gray-600">@{subtitleHandle}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`text-xs px-2 py-1 rounded-full ${getNotificationBadge(
                  notification.kind
                )}`}
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

          {postContent && (
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded mb-2">
              {postContent.length > 100
                ? `${postContent.substring(0, 100)}...`
                : postContent}
            </div>
          )}

          <div className="text-xs text-gray-400">
            {new Date(notification.createdAt).toLocaleString("ko-KR")}
          </div>
        </div>
      </div>
    </div>
  );
}
