import { useEffect, useMemo, useState } from 'react';

/**
 * Client-side pagination over an already-fetched/filtered array.
 * Pass `resetKey` (e.g. search + filter values) to jump back to page 0 when it changes.
 */
export function useClientPagination<T>(items: T[], size = 10, resetKey?: unknown) {
  const [page, setPage] = useState(0);
  const total = items.length;

  useEffect(() => { setPage(0); }, [resetKey]);

  const lastPage = Math.max(0, Math.ceil(total / size) - 1);
  const safePage = Math.min(page, lastPage);

  const pageItems = useMemo(
    () => items.slice(safePage * size, safePage * size + size),
    [items, safePage, size],
  );

  return { pageItems, page: safePage, setPage, total };
}
