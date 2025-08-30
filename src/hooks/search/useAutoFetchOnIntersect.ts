"use client";

import { useEffect, useRef } from "react";

export function useAutoFetchOnIntersect<T extends Element>(
  enabled: boolean,
  fetchMore: () => void,
  deps: any[] = []
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchMore();
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, fetchMore, ...deps]);

  return ref;
}
