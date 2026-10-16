import { describe, expect, it } from 'vitest';

import { paginationSearchSchema } from './search';

describe('route pagination search', () => {
  it('should preserve defaults and coerce parsed URL values', () => {
    expect(paginationSearchSchema.parse({})).toEqual({ page: 1, limit: 20 });
    expect(paginationSearchSchema.parse({ page: '2.9', limit: 5000 })).toEqual({
      page: 2,
      limit: 1000,
    });
    expect(
      paginationSearchSchema.parse({ page: 'invalid', limit: -4 })
    ).toEqual({
      page: 1,
      limit: 1,
    });
  });

  it('should use the first repeated query value', () => {
    expect(
      paginationSearchSchema.parse({ page: ['3', '4'], limit: ['5', '6'] })
    ).toEqual({
      page: 3,
      limit: 5,
    });
  });

  it('should retain client-side filters during route navigation', () => {
    const filters = {
      q: 'questions',
      status: 'running',
      from: '2026-10-01T00:00:00Z',
      to: '2026-10-02T00:00:00Z',
      sort: 'recent',
    };
    expect(paginationSearchSchema.parse(filters)).toEqual({
      ...filters,
      page: 1,
      limit: 20,
    });
  });
});
