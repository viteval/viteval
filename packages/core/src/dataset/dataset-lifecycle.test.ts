import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { err } from 'massaman/control';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getProjectRuntime, withProjectRuntime } from '#/config/runtime';
import { runWithExecution } from '#/config/execution';
import { createJsonProvider } from '#/provider/json';
import type { Provider } from '#/provider/types';
import { defineDataset } from './dataset';

declare module '#/provider/registry' {
  interface ProviderRegistry {
    datasetMirror: { datasets: true; results: true };
  }
}

let root: string;
const ITEMS = [{ input: 'q', expected: 'a', context: 'reference' }];

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'viteval-dataset-lifecycle-'));
});
afterEach(async () => {
  vi.restoreAllMocks();
  await rm(root, { recursive: true, force: true });
});

describe('dataset lifecycle', () => {
  it('should use local JSON storage outside a configured worker', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue(root);
    const dataset = defineDataset({ name: 'standalone', data: ITEMS });
    expect(await dataset.exists()).toMatchObject({ ok: true, value: false });
    expect(await dataset.save()).toMatchObject({ ok: true });
    expect(await dataset.exists()).toMatchObject({ ok: true, value: true });
    expect(await dataset.load()).toMatchObject({ ok: true, value: ITEMS });
  });

  it.each(['memory', 'disabled'] as const)(
    'should generate %s data without persistence',
    async (mode) => {
      const dataset = defineDataset({
        name: 'memory',
        data: ITEMS,
        ...(mode === 'memory'
          ? { storage: 'memory' as const }
          : { providers: [] }),
      });
      expect(await dataset.exists()).toMatchObject({ ok: true, value: false });
      expect(await dataset.load()).toMatchObject({ ok: true, value: ITEMS });
      expect(await dataset.save()).toMatchObject({ ok: true });
      expect(await dataset.exists()).toMatchObject({ ok: true, value: false });
    }
  );

  it('should return absent data unless creation is explicitly requested', async () => {
    await useJsonRuntime(async () => {
      let generations = 0;
      const dataset = defineDataset({
        name: 'generated',
        data: () => {
          generations++;
          return ITEMS;
        },
      });
      expect(await dataset.exists()).toMatchObject({ ok: true, value: false });
      expect(await dataset.load()).toMatchObject({ ok: true, value: null });
      expect(generations).toBe(0);
      expect(await dataset.load({ create: true })).toMatchObject({
        ok: true,
        value: ITEMS,
      });
      expect(await dataset.load({ create: true })).toMatchObject({
        ok: true,
        value: ITEMS,
      });
      expect(generations).toBe(1);
      expect(await dataset.exists()).toMatchObject({ ok: true, value: true });
    });
  });

  it('should not regenerate stored data unless overwrite is requested', async () => {
    await useJsonRuntime(async () => {
      let generations = 0;
      const dataset = defineDataset({
        name: 'once',
        data: () => {
          generations++;
          return ITEMS;
        },
      });
      await dataset.save();
      await dataset.save();
      expect(generations).toBe(1);
      await dataset.save({ overwrite: true });
      expect(generations).toBe(2);
    });
  });

  it('should return generator rejection through load and save Results', async () => {
    const dataset = defineDataset({
      name: 'failure',
      storage: 'memory',
      data: async () => {
        throw new Error('generation rejected');
      },
    });
    expect(await dataset.load()).toMatchObject({
      ok: false,
      error: { message: 'generation rejected' },
    });
    expect(await dataset.save()).toMatchObject({
      ok: false,
      error: { message: 'generation rejected' },
    });
  });

  it('should reject named destinations outside a configured project', async () => {
    const dataset = defineDataset({
      name: 'explicit',
      data: ITEMS,
      providers: ['json'],
    });
    for (const result of [
      await dataset.exists(),
      await dataset.load(),
      await dataset.save(),
    ]) {
      expect(result).toMatchObject({
        ok: false,
        error: {
          message:
            'Dataset destinations require a Viteval project configuration',
        },
      });
    }
  });

  it('should expose dataset declarations to discovery without generating them', () => {
    const registered: unknown[] = [];
    const discovery = {
      register: (value) => {
        registered.push(value);
      },
    };
    runWithExecution({
      scope: { discovery },
      run: () => {
        const dataset = defineDataset({ name: 'discovered', data: ITEMS });
        expect(registered).toEqual([dataset]);
      },
    });
  });

  it('should initialize configured destinations and load generated data', async () => {
    await withProjectRuntime({
      config: { root },
      run: async () => {
        const dataset = defineDataset({
          name: 'configured',
          data: ({ json }) => {
            expect(json.dataset('configured').name).toBe('configured');
            return ITEMS;
          },
        });
        expect(await dataset.load({ create: true })).toMatchObject({
          ok: true,
          value: ITEMS,
        });
        expect(await dataset.exists()).toMatchObject({ ok: true, value: true });
      },
    });
  });

  it('should reject configured providers that cannot store datasets', async () => {
    const { datasets: _datasets, ...provider } = createJsonProvider({ root });
    await withProjectRuntime({
      config: {
        providers: [provider],
      },
      run: async () => {
        expect(
          await defineDataset({ name: 'unsupported', data: ITEMS }).load()
        ).toMatchObject({
          ok: false,
          error: { message: 'Provider "json" does not support datasets' },
        });
      },
    });
  });

  it('should save once to every destination while requiring an explicit read source', async () => {
    const mirror = createJsonProvider({ root: path.join(root, 'mirror') });
    await withProjectRuntime({
      config: {
        root,
        providers: [
          createJsonProvider({ root }),
          { ...mirror, name: 'datasetMirror' },
        ],
        dataset: { providers: ['json', 'datasetMirror'] },
      },
      run: async () => {
        let generations = 0;
        const dataset = defineDataset({
          name: 'replicated',
          data: () => {
            generations++;
            return ITEMS;
          },
        });
        expect(await dataset.exists()).toMatchObject({
          ok: true,
          value: false,
        });
        expect(await dataset.load({ create: true })).toMatchObject({
          ok: false,
          error: { message: expect.stringContaining('multiple destinations') },
        });
        expect(generations).toBe(0);
        expect(await dataset.save()).toMatchObject({ ok: true });
        expect(generations).toBe(1);
        expect(await dataset.exists()).toMatchObject({ ok: true, value: true });
        expect(
          await getProjectRuntime()!.context.json.dataset('replicated').load()
        ).toEqual(ITEMS);
        expect(
          await getProjectRuntime()!
            .context.datasetMirror.dataset('replicated')
            .load()
        ).toEqual(ITEMS);
      },
    });
  });

  it.each(['lookup', 'items', 'create'] as const)(
    'should preserve %s failures as load Results',
    async (operation) => {
      const provider = createJsonProvider({ root });
      if (operation === 'items')
        await provider.datasets!.create({ name: 'broken' });
      const datasets = {
        ...provider.datasets!,
        ...(operation === 'lookup'
          ? { get: async () => err('lookup rejected') }
          : {}),
        ...(operation === 'items'
          ? { getItems: async () => err('items rejected') }
          : {}),
        ...(operation === 'create'
          ? { create: async () => err('create rejected') }
          : {}),
      };
      await withProjectRuntime({
        config: {
          providers: [{ ...provider, datasets }],
        },
        run: async () => {
          expect(
            await defineDataset({ name: 'broken', data: ITEMS }).load({
              create: true,
            })
          ).toMatchObject({
            ok: false,
            error: { message: `${operation} rejected` },
          });
        },
      });
    }
  );

  it('should preserve lookup failures in exists and save Results', async () => {
    await installBrokenProvider({
      overrides: { get: async () => err('lookup rejected') },
      run: async () => {
        const dataset = defineDataset({ name: 'broken', data: ITEMS });
        expect(await dataset.exists()).toMatchObject({
          ok: false,
          error: { message: 'lookup rejected' },
        });
        expect(await dataset.save()).toMatchObject({
          ok: false,
          error: { message: 'lookup rejected' },
        });
      },
    });
  });

  it('should aggregate dataset save failures with their original errors', async () => {
    await installBrokenProvider({
      overrides: { create: async () => err('save rejected') },
      run: async () => {
        const result = await defineDataset({
          name: 'broken',
          data: ITEMS,
        }).save();
        expect(result).toMatchObject({
          ok: false,
          error: {
            message: 'Failed to save dataset "broken": save rejected',
            errors: [{ message: 'save rejected' }],
          },
        });
      },
    });
  });
});

function useJsonRuntime(run: () => Promise<void>): Promise<void> {
  return withProjectRuntime({
    config: { providers: [createJsonProvider({ root })] },
    run,
  });
}

function installBrokenProvider({
  overrides,
  run,
}: {
  overrides: Partial<NonNullable<Provider['datasets']>>;
  run: () => Promise<void>;
}) {
  const provider = createJsonProvider({ root });
  return withProjectRuntime({
    config: {
      providers: [
        { ...provider, datasets: { ...provider.datasets!, ...overrides } },
      ],
    },
    run,
  });
}
