import type { VitevalListResponse } from './types';

const DEFAULT_LIMIT = 20;

/**
 * Paginate an array and return a VitevalListResponse.
 */
export function paginate<T>(
  items: T[],
  page = 1,
  limit = DEFAULT_LIMIT
): VitevalListResponse<T> {
  const total = items.length;
  const safeLimit = Math.max(1, limit);
  const safePage = Math.max(1, page);
  const offset = (safePage - 1) * safeLimit;
  const data = items.slice(offset, offset + safeLimit);

  return {
    data,
    hasMore: offset + safeLimit < total,
    limit: safeLimit,
    page: safePage,
    total,
  };
}
