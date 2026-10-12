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

const listFields = {
  page: z.number(),
  limit: z.number(),
  q: z.string().catch(''),
  sort: z.string().optional().catch(undefined),
  order: z.enum(['asc', 'desc']).optional().catch(undefined),
};

/** Search values shared by remote tables and HTTP dataset listings. */
export const datasetsSearchSchema = paginationSearchSchema.pipe(
  z.looseObject({
    ...listFields,
    sort: z
      .enum(['name', 'recent', 'createdAt', 'itemCount', 'source'])
      .optional()
      .catch(undefined),
  })
);

/** Filters applied to the complete run collection before pagination. */
export const resultsSearchSchema = paginationSearchSchema.pipe(
  z.looseObject({
    ...listFields,
    status: z
      .enum(['passed', 'failed', 'running', 'finished'])
      .optional()
      .catch(undefined),
    from: z.string().optional().catch(undefined),
    to: z.string().optional().catch(undefined),
  })
);

/** Filters applied to the complete suite collection before pagination. */
export const suitesSearchSchema = paginationSearchSchema.pipe(
  z.looseObject({
    ...listFields,
    status: z.enum(['passed', 'failed', 'running']).optional().catch(undefined),
  })
);

function toSearchValue(value: unknown): string | string[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  return Array.isArray(value) ? value.map(String) : String(value);
}
