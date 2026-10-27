import { err, ok } from 'massaman/control';
import { describe, expect, it, vi } from 'vitest';
import { writeDestinations } from './destinations';

describe('writeDestinations', () => {
  it('should return every successful outcome in destination order', async () => {
    expect(
      await writeDestinations([
        async () => ok('json'),
        async () => ok('hosted'),
      ])
    ).toEqual(['json', 'hosted']);
  });

  it('should attempt every destination and include returned and thrown failures', async () => {
    const healthy = vi.fn(async () => ok('saved')),
      result = writeDestinations([
        async () => err('rejected upload'),
        async () => {
          throw new Error('offline');
        },
        healthy,
      ]);
    await expect(result).rejects.toThrow('rejected upload; offline');
    expect(healthy).toHaveBeenCalledTimes(1);
  });
});
