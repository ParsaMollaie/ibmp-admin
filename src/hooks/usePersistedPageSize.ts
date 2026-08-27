import { useState } from 'react';

const STORAGE_PREFIX = 'admin-list-page-size:';

/**
 * Persists an admin list's chosen page size to localStorage, keyed per list,
 * so it survives a refresh or later revisit. Falls back to the given
 * default when nothing valid is stored yet.
 */
export default function usePersistedPageSize(
  pageKey: string,
  fallback: number,
) {
  const storageKey = `${STORAGE_PREFIX}${pageKey}`;

  const [pageSize, setPageSizeState] = useState<number>(() => {
    const stored = window.localStorage.getItem(storageKey);
    const parsed = stored ? Number(stored) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  });

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    try {
      window.localStorage.setItem(storageKey, String(size));
    } catch {
      // localStorage unavailable (private mode, quota) — keep working in-memory only
    }
  };

  return [pageSize, setPageSize] as const;
}
