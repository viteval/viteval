import { z } from 'zod';

import { parsePaginateParams } from '@/sdk/paginate';

/** Preserves the SDK's pagination coercion for Router's parsed search values. */
export const paginationSearchSchema = z
  .looseObject({
    page: z.unknown().optional(),
    limit: z.unknown().optional(),
  })
  .transform((search) => ({
    ...search,
    ...parsePaginateParams({
      page: toSearchValue(search.page),
      limit: toSearchValue(search.limit),
    }),
  }));

function toSearchValue(value: unknown): string | string[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  return Array.isArray(value) ? value.map(String) : String(value);
}
