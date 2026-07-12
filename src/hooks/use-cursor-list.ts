"use client";

/**
 * useCursorList — cursor pagination for list endpoints.
 *
 * Maintains a stack of page cursors so the UI can go forward and back.
 * Pass a stable `resetToken` (e.g. JSON of the active filters); when it changes
 * the cursor stack resets to the first page. The cursor is opaque — never decode it.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { Paginated, PaginatedMeta } from "@/api/types";

interface UseCursorListArgs<T> {
  queryKey: readonly unknown[];
  fetcher: (params: { cursor?: string; limit: number }) => Promise<Paginated<T>>;
  limit?: number;
  enabled?: boolean;
  /** Serialised filters — changing this resets pagination to page 1. */
  resetToken?: string;
}

export function useCursorList<T>({
  queryKey,
  fetcher,
  limit = 50,
  enabled = true,
  resetToken = "",
}: UseCursorListArgs<T>) {
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const current = cursors[cursors.length - 1];

  // Reset to the first page whenever the filter token changes.
  const prevToken = useRef(resetToken);
  useEffect(() => {
    if (prevToken.current !== resetToken) {
      prevToken.current = resetToken;
      setCursors([null]);
    }
  }, [resetToken]);

  const query = useQuery({
    queryKey: [...queryKey, resetToken, current, limit],
    queryFn: () => fetcher({ cursor: current ?? undefined, limit }),
    placeholderData: keepPreviousData,
    enabled,
  });

  const meta: PaginatedMeta | undefined = query.data?.meta;

  const next = useCallback(() => {
    setCursors((c) => {
      const m = query.data?.meta;
      return m?.nextCursor ? [...c, m.nextCursor] : c;
    });
  }, [query.data]);

  const prev = useCallback(
    () => setCursors((c) => (c.length > 1 ? c.slice(0, -1) : c)),
    [],
  );

  return {
    ...query,
    items: query.data?.data ?? [],
    meta,
    page: cursors.length,
    canPrev: cursors.length > 1,
    canNext: !!meta?.hasMore,
    next,
    prev,
  };
}
