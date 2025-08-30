import z from "zod";
import { PostSchema } from "..";

export const SearchedPostSchema = PostSchema;

export const SearchedResponseSchema = z.object({
  query: z.string(),
  type: z.enum(["posts", "people"]),
  total: z.number(),
  searchTime: z.number(),
  posts: z.object({
    items: z.array(SearchedPostSchema),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});

export type SearchedPost = z.infer<typeof SearchedPostSchema>;
export type SearchedResponse = z.infer<typeof SearchedResponseSchema>;
