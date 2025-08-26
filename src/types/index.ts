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

export interface SignupRequest {
  email: string;
  handle: string;
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

export interface Post {
  id: number;
  userId: number;
  text: string; // 백엔드에서 'text'로 반환
  media?: MediaItem[] | null;
  createdAt: string;
  replyTo?: number;
  quotePostId?: number;
  isHidden?: boolean;
  author: {
    id: number;
    handle: string;
    bio?: string;
    trustScore?: number;
    verifiedFlags?: any;
  };
  symbols?: Array<{
    raw: string;
    ticker: string;
    kind: string;
    exchange?: string;
  }>;
  reactionCounts?: {
    LIKE?: number;
    BOOST?: number;
    BOOKMARK?: number;
  };
  userReactions?: string[];
  score?: number;
  scoreBreakdown?: any;
  isFollowing?: boolean;
  // 호환성을 위한 추가 필드들 (PostCard에서 사용)
  user: {
    id: number;
    handle: string;
    displayName?: string;
    email?: string;
  };
  _count?: {
    likes: number;
    boosts: number;
    bookmarks: number;
    replies: number;
  };
  isLiked?: boolean;
  isBoosted?: boolean;
  isBookmarked?: boolean;
  reactions?: Reaction[];
  replies?: Post[];
}

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

// 알림 관련 타입
export type NotificationKind = "MENTION" | "REPLY" | "REACTION" | "FOLLOW";

export interface Notification {
  id: number;
  userId: number;
  kind: NotificationKind;
  payload: any;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

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
