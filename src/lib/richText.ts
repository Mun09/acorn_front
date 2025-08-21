/**
 * 텍스트에서 캐시태그와 멘션을 파싱하고 하이라이트하는 유틸리티
 */

export interface ParsedToken {
  type: "text" | "hashtag" | "mention";
  content: string;
  symbol?: string; // 캐시태그의 경우 심볼 ($TSLA -> TSLA)
  handle?: string; // 멘션의 경우 핸들 (@user -> user)
}

// 캐시태그 정규식: $ABC, $ABC.DE 등
const HASHTAG_REGEX = /\$([A-Z]{1,5}(?:\.[A-Z]{1,3})?)/g;

// 멘션 정규식: @username (영문, 숫자, 언더스코어)
const MENTION_REGEX = /@([a-zA-Z0-9_]{3,20})/g;

/**
 * 텍스트를 파싱하여 일반 텍스트, 캐시태그, 멘션으로 분리
 */
export function parseRichText(text: string): ParsedToken[] {
  const tokens: ParsedToken[] = [];
  let lastIndex = 0;

  // 모든 매치를 찾아서 위치순으로 정렬
  const matches: Array<{
    type: "hashtag" | "mention";
    index: number;
    length: number;
    content: string;
    symbol?: string;
    handle?: string;
  }> = [];

  // 캐시태그 매치
  let match;
  while ((match = HASHTAG_REGEX.exec(text)) !== null) {
    matches.push({
      type: "hashtag",
      index: match.index,
      length: match[0].length,
      content: match[0],
      symbol: match[1],
    });
  }

  // 멘션 매치
  MENTION_REGEX.lastIndex = 0; // 정규식 인덱스 리셋
  while ((match = MENTION_REGEX.exec(text)) !== null) {
    matches.push({
      type: "mention",
      index: match.index,
      length: match[0].length,
      content: match[0],
      handle: match[1],
    });
  }

  // 인덱스순으로 정렬
  matches.sort((a, b) => a.index - b.index);

  // 토큰 생성
  for (const matchItem of matches) {
    // 이전 매치와 현재 매치 사이의 일반 텍스트
    if (lastIndex < matchItem.index) {
      const plainText = text.slice(lastIndex, matchItem.index);
      if (plainText) {
        tokens.push({
          type: "text",
          content: plainText,
        });
      }
    }

    // 현재 매치 추가
    tokens.push({
      type: matchItem.type,
      content: matchItem.content,
      symbol: matchItem.symbol,
      handle: matchItem.handle,
    });

    lastIndex = matchItem.index + matchItem.length;
  }

  // 마지막 남은 텍스트
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    if (remainingText) {
      tokens.push({
        type: "text",
        content: remainingText,
      });
    }
  }

  // 매치가 없으면 전체를 일반 텍스트로 처리
  if (tokens.length === 0) {
    tokens.push({
      type: "text",
      content: text,
    });
  }

  return tokens;
}

/**
 * 텍스트에서 캐시태그 추출
 */
export function extractCashTags(text: string): string[] {
  const matches = text.match(HASHTAG_REGEX);
  return matches ? matches.map((match) => match.slice(1)) : []; // $ 제거
}

/**
 * 텍스트에서 멘션 추출
 */
export function extractMentions(text: string): string[] {
  const matches = text.match(MENTION_REGEX);
  return matches ? matches.map((match) => match.slice(1)) : []; // @ 제거
}
