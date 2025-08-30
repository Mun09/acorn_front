import { z } from "zod";

export const SearchedUserSchema = z.object({
  id: z.number(),
  handle: z.string(),
  displayName: z.string(),
  bio: z.string().nullable(), // bio가 null 가능
  avatar: z.string().nullable(), // avatar가 null
  verified: z.boolean(),
  followerCount: z.number(),
  followingCount: z.number(),
  postCount: z.number(),
  trustScore: z.number(),
  rank: z.number(),
  highlights: z.object({
    handle: z.array(z.string()),
    displayName: z.array(z.string()),
    bio: z.union([z.array(z.string()), z.string()]),
  }),
});

export const SearchedResponseSchema = z.object({
  query: z.string(),
  type: z.enum(["posts", "people"]),
  total: z.number(),
  searchTime: z.number(),
  people: z.object({
    items: z.array(SearchedUserSchema),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});

export type SearchedUser = z.infer<typeof SearchedUserSchema>;
export type SearchedResponse = z.infer<typeof SearchedResponseSchema>;
