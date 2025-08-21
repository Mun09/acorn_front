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
export interface Post {
  id: number;
  userId: number;
  text: string;
  media?: any;
  createdAt: string;
  replyTo?: number;
  quotePostId?: number;
  isHidden: boolean;
  user: User;
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
