export interface Post {
  id: number;
  text: string;
  media?: any; // JSON type for media
  createdAt: string;
  replyTo?: number;
  quotePostId?: number;
  isHidden: boolean;
  symbols: Array<{ symbol: string }>;
  user: {
    id: number;
    handle: string;
  };
  reactions: Array<{ type: string; userId: number }>;
  replyCount: number;
  quotes?: Array<Post>;
}
