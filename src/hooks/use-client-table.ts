"use client";

/**
 * useClientTable — search + pagination for lists the API returns in full
 * (plain arrays, no cursor support). Filtering and slicing happen in the
 * browser, so only use this for endpoints that return the whole collection.
 */

import { useEffect, useMemo, useState } from "react";

interface UseClientTableArgs<T> {
  items: T[];
  /** Case-insensitive search term. Empty string disables filtering. */
  query?: string;
  /** Predicate run for each item; receives the lower-cased, trimmed query. */
  filterFn: (item: T, query: string) => boolean;
  pageSize?: number;
}

export function useClientTable<T>({
  items,
  query = "",
  filterFn,
  pageSize = 10,
}: UseClientTableArgs<T>) {
  const normalized = query.trim().toLowerCase();
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () => (normalized ? items.filter((item) => filterFn(item, normalized)) : items),
    [items, normalized, filterFn],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset paging when the filter/size changes
    setPage(1);
  }, [normalized, pageSize]);

  const current = Math.min(page, pageCount);
  const rows = useMemo(
    () => filtered.slice((current - 1) * pageSize, current * pageSize),
    [filtered, current, pageSize],
  );

  return {
    rows,
    total: filtered.length,
    page: current,
    pageCount,
    canPrev: current > 1,
    canNext: current < pageCount,
    next: () => setPage((p) => Math.min(p + 1, pageCount)),
    prev: () => setPage((p) => Math.max(p - 1, 1)),
  };
}
