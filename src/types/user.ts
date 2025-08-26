export interface UserProfile {
  id: string;
  handle: string;
  bio: string;
  trustScore: number;
  joinedAt: string;
  stats: {
    posts: number;
    followers: number;
    following: number;
  };
  isFollowing: boolean;
}
