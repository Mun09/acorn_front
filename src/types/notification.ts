export type NotificationKind =
  | "MENTION"
  | "REACTION"
  | "REPLY"
  | "FOLLOW"
  | "SYSTEM";

export interface BaseNotification {
  id: number;
  userId: number;
  readAt: string | null;
  createdAt: string; // ISO 8601
}

export interface MentionNotification {
  kind: "MENTION";
  payload: {
    fromHandle: string;
    fromUserId: number;
    postId?: number;
    postContent?: string;
    message?: string;
  };
}

export interface ReplyNotification {
  kind: "REPLY";
  payload: {
    fromHandle: string;
    fromUserId: number;
    postId: number;
    commentId?: number;
    postContent?: string;
    message?: string;
  };
}

export interface ReactionNotification {
  kind: "REACTION";
  payload: {
    fromHandle: string;
    fromUserId: number;
    reactionType: "LIKE" | "BOOKMARK" | "BOOST" | string;
    postId: number;
    postContent?: string;
    message?: string;
  };
}

export interface FollowNotification {
  kind: "FOLLOW";
  payload: {
    fromHandle: string;
    fromUserId: number;
    message?: string;
  };
}

export interface SystemNotification {
  kind: "SYSTEM";
  payload: {
    title?: string;
    message: string;
    linkUrl?: string; // 공지 상세 링크 등
    postId?: number; // 특정 포스트로 유도하는 경우
  };
}

export type Notification =
  | (BaseNotification & MentionNotification)
  | (BaseNotification & ReactionNotification)
  | (BaseNotification & ReplyNotification)
  | (BaseNotification & FollowNotification)
  | (BaseNotification & SystemNotification);

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
