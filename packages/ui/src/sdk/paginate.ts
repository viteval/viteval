import type { VitevalListResponse } from './types';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 1000;

export interface PaginateParams {
  page?: number;
  limit?: number;
}

/**
 * Paginate an array and return a VitevalListResponse.
 *
 * Coerces NaN/negative/oversized inputs to safe defaults so the
 * `VitevalListResponse` contract (`page`/`limit` are numbers) holds
 * even when callers pass garbage from URL query strings.
 */
export function paginate<T>(
  items: T[],
  params: PaginateParams = {}
): VitevalListResponse<T> {
  const total = items.length;
  const safeLimit = clampInt(params.limit, DEFAULT_LIMIT, 1, MAX_LIMIT);
  const safePage = clampInt(params.page, 1, 1, Number.MAX_SAFE_INTEGER);
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

/**
 * Parse `page` and `limit` from URL `searchParams`, coercing invalid
 * values to safe defaults. Returns `PaginateParams` suitable for
 * passing directly to `paginate()` or an SDK resource.
 */
export function parsePaginateParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): Required<PaginateParams> {
  const get = (key: string): string | undefined => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key) ?? undefined;
    }
    const v = searchParams[key];
    return Array.isArray(v) ? v[0] : v;
  };
  return {
    limit: clampInt(get('limit'), DEFAULT_LIMIT, 1, MAX_LIMIT),
    page: clampInt(get('page'), 1, 1, Number.MAX_SAFE_INTEGER),
  };
}

function clampInt(
  raw: number | string | undefined,
  fallback: number,
  min: number,
  max: number
): number {
  const parsed = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  const floored = Math.floor(parsed);
  if (floored < min) {
    return min;
  }
  if (floored > max) {
    return max;
  }
  return floored;
}
