// UserCard.tsx
"use client";

import { Users } from "lucide-react";
import Link from "next/link";
import { SearchedUser } from "@/types/search/people";

export function UserCard({ user }: { user: SearchedUser }) {
  return (
    <Link
      href={`/users/${user.handle}`}
      className="block border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
          <Users className="w-6 h-6 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-foreground">
              {user.displayName}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">@{user.handle}</p>
          {user.bio && (
            <p className="text-sm text-foreground mt-1 line-clamp-2">
              {user.bio}
            </p>
          )}
          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
            <span>{user.followerCount || 0} 팔로워</span>
            <span>{user.followingCount || 0} 팔로잉</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
