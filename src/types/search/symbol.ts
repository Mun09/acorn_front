// types/symbol.ts
import { z } from "zod";

export const SymbolSchema = z.object({
  id: z.number(),
  ticker: z.string(),
  kind: z.string(),
  exchange: z.string(),
  meta: z.any().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  _count: z.object({ posts: z.number() }).optional(), // ← 응답이 없을 수도 있으면 optional
});

export type Symbol = z.infer<typeof SymbolSchema>;

// 무한스크롤 1페이지 스키마
export const SearchSymbolsPageSchema = z.object({
  symbols: z.array(SymbolSchema),
  nextCursor: z.string().nullable(),
});
export type SearchSymbolsPage = z.infer<typeof SearchSymbolsPageSchema>;

export const SearchSymbolsResponseSchema = z.object({
  success: z.boolean(),
  data: SearchSymbolsPageSchema,
});
export type SearchSymbolsResponse = z.infer<typeof SearchSymbolsResponseSchema>;
