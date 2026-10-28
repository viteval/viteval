import { err, ok } from 'massaman/control';
import { describe, expect, it, vi } from 'vitest';
import { withProjectRuntime } from '#/config/runtime';
import { createJsonProvider } from './json';
import { getResultDestinations, writeDestinations } from './destinations';

describe('getResultDestinations', () => {
  it('should return no writers without a project runtime', async () => {
    expect(await getResultDestinations()).toEqual([]);
    expect(await getResultDestinations([])).toEqual([]);
  });

  it('should require project configuration for explicit destinations', async () => {
    await expect(getResultDestinations(['json'])).rejects.toThrow(
      'require a Viteval project configuration'
    );
  });

  it('should resolve configured writers and allow disabling them', async () => {
    const provider = createJsonProvider();
    await withProjectRuntime({
      config: {
        providers: [provider],
      },
      run: async () => {
        expect(await getResultDestinations()).toEqual([provider.evals]);
        expect(await getResultDestinations(['json'])).toEqual([provider.evals]);
        expect(await getResultDestinations([])).toEqual([]);
      },
    });
  });

  it('should reject destinations without evaluation capabilities', async () => {
    const { evals: _evals, ...provider } = createJsonProvider();
    await withProjectRuntime({
      config: {
        providers: [provider],
      },
      run: async () => {
        await expect(getResultDestinations()).rejects.toThrow(
          'does not support evaluation results'
        );
      },
    });
  });
});

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

  it('should preserve selection order regardless of completion order', async () => {
    let completeFirst: (
      value: ReturnType<typeof ok<number>>
    ) => void = () => {};
    const first = new Promise<ReturnType<typeof ok<number>>>((resolve) => {
      completeFirst = resolve;
    });
    const result = writeDestinations([
      () => first,
      async () => {
        completeFirst(ok(1));
        return ok(2);
      },
    ]);
    expect(await result).toEqual([1, 2]);
    expect(await writeDestinations([])).toEqual([]);
  });

  it('should attempt every operation and retain original returned and thrown errors', async () => {
    const returned = new Error('returned failure');
    let healthyFinished = false;
    const result = writeDestinations([
      async () => err(returned),
      async () => {
        throw 'non-error rejection';
      },
      async () => {
        healthyFinished = true;
        return ok('saved');
      },
    ]);
    await expect(result).rejects.toMatchObject({
      errors: [returned, 'non-error rejection'],
      message:
        'Result persistence failed: returned failure; non-error rejection',
    });
    expect(healthyFinished).toBe(true);
  });
});
