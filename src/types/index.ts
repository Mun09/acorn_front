import { z } from "zod";

// 공통 타입 정의

// API 응답 타입
export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
  statusCode?: number;
}

// 사용자 관련 타입
export interface User {
  id: number;
  email: string;
  handle: string;
  bio?: string | null;
  trustScore: number;
  verifiedFlags?: any;
  createdAt: string;
  updatedAt: string;
}

// 인증 관련 타입
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

// 포스트 관련 타입
export interface MediaItem {
  url: string;
  type: "image" | "video";
}

export interface PostSymbol {
  symbolId: number;
  symbol: Symbol;
}

export const ReactionSchema = z.object({
  id: z.number(),
  postId: z.number(),
  userId: z.number(),
  type: z.enum(["LIKE", "BOOKMARK", "BOOST"]),
  user: z.object({
    id: z.number(),
    email: z.string(),
    handle: z.string(),
    bio: z.string().nullable().optional(),
    trustScore: z.number(),
    verifiedFlags: z.any().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

export const PostSchema = z.object({
  id: z.number(),
  userId: z.number(),
  text: z.string(),
  createdAt: z.string(),
  replyTo: z.number().optional(),
  quotePostId: z.number().optional(),
  isHidden: z.boolean().optional(),
  author: z.object({
    id: z.number(),
    handle: z.string(),
    bio: z.string().optional(),
    trustScore: z.number().optional(),
    verifiedFlags: z.any().optional(),
  }),
  symbols: z
    .array(
      z.object({
        raw: z.string(),
        ticker: z.string(),
        kind: z.string(),
        exchange: z.string().optional(),
      })
    )
    .optional(),
  reactionCounts: z
    .object({
      LIKE: z.number().optional(),
      BOOST: z.number().optional(),
      BOOKMARK: z.number().optional(),
    })
    .optional(),
  userReactions: z.array(z.string()).optional(),
  score: z.number().optional(),
  scoreBreakdown: z.any().optional(),
  isFollowing: z.boolean().optional(),
  user: z
    .object({
      id: z.number(),
      handle: z.string(),
      displayName: z.string().optional(),
      email: z.string().optional(),
    })
    .optional(),
  _count: z
    .object({
      likes: z.number(),
      boosts: z.number(),
      bookmarks: z.number(),
      replies: z.number(),
    })
    .optional(),
  isLiked: z.boolean().optional(),
  isBoosted: z.boolean().optional(),
  isBookmarked: z.boolean().optional(),
  reactions: z.array(ReactionSchema).optional(),
});

export type Post = z.infer<typeof PostSchema>;

export interface Reaction {
  id: number;
  postId: number;
  userId: number;
  type: "LIKE" | "BOOKMARK" | "BOOST";
  user: User;
}

// 심볼 관련 타입
export interface Symbol {
  id: number;
  ticker: string;
  exchange: string;
  kind: "STOCK" | "CRYPTO" | "ETF";
  meta?: any;
}

// 폼 관련 타입
export interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "password" | "textarea" | "select";
  placeholder?: string;
  required?: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    message?: string;
  };
}

// 상태 관리 타입
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  theme: "light" | "dark";
}

// 컴포넌트 Props 타입
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps extends ComponentProps {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

export interface InputProps extends ComponentProps {
  type?: "text" | "email" | "password" | "search";
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export interface FollowPayload {
  fromHandle: string;
  fromUserId: number;
  message: string;
}

export type NotificationPayload = FollowPayload;

// 검색 관련 타입
export interface SearchUser {
  id: number;
  handle: string;
  displayName?: string;
  bio?: string;
  isVerified?: boolean;
  followerCount?: number;
  followingCount?: number;
  avatarUrl?: string;
}

export interface SearchSymbol {
  ticker: string;
  name?: string;
  kind?: string;
  price?: number;
  change?: number;
  postCount?: number;
  mentionCount?: number;
}

export interface SearchResponse {
  results: Post[] | SearchUser[] | SearchSymbol[];
  hasMore: boolean;
  nextCursor?: string;
  total: number;
}
