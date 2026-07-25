import { useMemo, useState } from 'react';

/**
 * Client-side pagination over an already-fetched array. The visible page is
 * clamped to the valid range during render (not via an effect + setState,
 * which would cause an extra render pass) — so it settles back to the last
 * valid page if the item count shrinks below it, without forcing a jump to
 * page 1 on every change. That keeps it stable across background polling
 * refreshes. Callers that need an explicit reset (e.g. on search/filter
 * change) can call the returned `setPage(1)` themselves.
 */
export default function usePagination(items, pageSize = 10) {
  const [rawPage, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(rawPage, totalPages);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return { page, setPage, totalPages, pageItems };
}
