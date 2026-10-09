"use client";

/**
 * useDebouncedValue — returns a value that only updates after `delay` ms of
 * no changes. Used to avoid firing an API request on every keystroke.
 */

import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}
