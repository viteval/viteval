import { err, ok } from 'massaman/control';
import { describe, expect, it, vi } from 'vitest';
import { createProvider } from '#/provider/create';
import { createJsonProvider } from '#/provider/json';
import { createProjectRuntime } from './runtime';

describe('createProjectRuntime', () => {
  it('should initialize used providers once and leave unused providers unopened', async () => {
    const initialize = vi.fn(async () => ok(undefined)),
      close = vi.fn(async () => ok(undefined)),
      unused = vi.fn(async () => ok(undefined)),
      provider = createProvider({ close, initialize, name: 'json' }),
      runtime = createProjectRuntime({
        providers: [
          provider,
          createProvider({ initialize: unused, name: 'unused' }),
        ],
      });
    expect(initialize).not.toHaveBeenCalled();
    expect(
      await Promise.all([runtime.provider('json'), runtime.provider('json')])
    ).toEqual([provider, provider]);
    expect(initialize).toHaveBeenCalledTimes(1);
    await runtime.close();
    await runtime.close();
    expect(close).toHaveBeenCalledTimes(1);
    expect(unused).not.toHaveBeenCalled();
    await expect(runtime.provider('json')).rejects.toThrow('closed');
  });

  it('should wait for initialization before closing a provider', async () => {
    const events: string[] = [],
      runtime = createProjectRuntime({
        providers: [
          createProvider({
            close: async () => {
              events.push('close');
              return ok(undefined);
            },
            initialize: async () => {
              await Promise.resolve();
              events.push('initialize');
              return ok(undefined);
            },
            name: 'json',
          }),
        ],
      });
    await Promise.all([runtime.provider('json'), runtime.close()]);
    expect(events).toEqual(['initialize', 'close']);
  });

  it('should attempt every close even when a provider fails', async () => {
    const close = vi.fn(async () => ok(undefined)),
      runtime = createProjectRuntime({
        providers: [
          createProvider({
            close: async () => err('flush rejected'),
            name: 'json',
          }),
          createProvider({ close, name: 'other' }),
        ],
      });
    await Promise.all([runtime.provider('json'), runtime.provider('other')]);
    await expect(runtime.close()).rejects.toThrow(AggregateError);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('should cache initialization errors rather than repeatedly opening clients', async () => {
    const initialize = vi.fn(async () => err('bad credentials')),
      runtime = createProjectRuntime({
        providers: [createProvider({ initialize, name: 'json' })],
      });
    await expect(runtime.provider('json')).rejects.toThrow('bad credentials');
    await expect(runtime.provider('json')).rejects.toThrow('bad credentials');
    expect(initialize).toHaveBeenCalledTimes(1);
    await expect(runtime.close()).rejects.toThrow(AggregateError);
  });

  it('should inherit destinations, replace explicit selections, and disable empty selections', () => {
    const runtime = createProjectRuntime({
      dataset: { providers: ['json'] },
      eval: { results: ['json'] },
    });
    expect(runtime.resultNames()).toEqual(['json']);
    expect(runtime.datasetNames()).toEqual(['json']);
    expect(runtime.resultNames([])).toEqual([]);
    expect(runtime.datasetNames([])).toEqual([]);
    expect(runtime.resultNames(['json', 'json'])).toEqual(['json']);
    expect(createProjectRuntime({ providers: [] }).resultNames()).toEqual([]);
  });

  it('should reject duplicate and reserved storage identities', () => {
    expect(() =>
      createProjectRuntime({
        providers: [createJsonProvider(), createJsonProvider()],
      })
    ).toThrow('Duplicate storage provider');
    expect(() =>
      createProjectRuntime({ providers: [createProvider({ name: 'models' })] })
    ).toThrow('reserved');
  });

  it('should report missing registrations without opening other providers', async () => {
    const runtime = createProjectRuntime({ providers: [] });
    await expect(runtime.provider('json')).rejects.toThrow('not registered');
    expect(() => runtime.context.json).toThrow('not registered');
    expect(() => runtime.resultNames(['json'])).toThrow('not registered');
  });

  it.each([
    { timeout: 0 },
    { timeout: -1 },
    { concurrency: 1.5 },
    { retries: -1 },
    { threshold: Number.NaN },
  ])('should reject invalid evaluation defaults %j', (evalOptions) => {
    expect(() => createProjectRuntime({ eval: evalOptions })).toThrow();
  });
});
