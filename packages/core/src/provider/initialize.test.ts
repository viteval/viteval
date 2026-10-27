import { err, ok } from 'massaman/control';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getDatasetProvider,
  getEvalProvider,
  getProvider,
  getTagProvider,
} from './client';
import { createProvider } from './create';
import { initializeProvider } from './initialize';
import { createJsonProvider } from './json';

beforeEach(() => {
  for (const name of [
    '__viteval_provider',
    '__viteval_datasetProvider',
    '__viteval_evalProvider',
    '__viteval_tagProvider',
    '__viteval_providerInitialized',
  ]) {
    vi.stubGlobal(name, undefined);
  }
});
afterEach(() => vi.unstubAllGlobals());

describe('initializeProvider', () => {
  it('should expose empty slots before initialization', () => {
    expect(getProvider()).toBeNull();
    expect(getDatasetProvider()).toBeNull();
    expect(getEvalProvider()).toBeNull();
    expect(getTagProvider()).toBeNull();
  });

  it('should initialize and expose a complete provider once', async () => {
    const initialize = vi.fn(async () => ok(undefined));
    const provider = createProvider({ ...createJsonProvider(), initialize });
    expect(await initializeProvider(provider)).toEqual(ok(undefined));
    expect(await initializeProvider(provider)).toEqual(ok(undefined));
    expect(initialize).toHaveBeenCalledTimes(1);
    expect(getProvider()).toBe(provider);
    expect(getDatasetProvider()).toBe(provider.datasets);
    expect(getEvalProvider()).toBe(provider.evals);
    expect(getTagProvider()).toBe(provider.tags);
    expect(await provider.close()).toEqual(ok(undefined));
  });

  it('should leave current clients intact after initialization fails', async () => {
    const existing = createJsonProvider();
    await initializeProvider(existing);
    const failure = err('unavailable');
    expect(
      await initializeProvider(
        createProvider({ name: 'broken', initialize: async () => failure })
      )
    ).toBe(failure);
    expect(getProvider()).toBe(existing);
    expect(getDatasetProvider()).toBe(existing.datasets);
  });

  it('should initialize one shared composite instance once and resolve each domain', async () => {
    const initialize = vi.fn(async () => ok(undefined));
    const provider = createProvider({ ...createJsonProvider(), initialize });
    expect(
      await initializeProvider({
        datasets: provider,
        evals: provider,
        tags: provider,
      })
    ).toEqual(ok(undefined));
    expect(initialize).toHaveBeenCalledTimes(1);
    expect(getProvider()).toBeNull();
    expect(getDatasetProvider()).toBe(provider.datasets);
    expect(getEvalProvider()).toBe(provider.evals);
    expect(getTagProvider()).toBe(provider.tags);
  });

  it('should stop a composite initialization on failure without publishing partial clients', async () => {
    const failure = err('offline');
    const later = vi.fn(async () => ok(undefined));
    expect(
      await initializeProvider({
        datasets: createProvider({
          name: 'broken',
          initialize: async () => failure,
        }),
        evals: createProvider({ name: 'later', initialize: later }),
      })
    ).toBe(failure);
    expect(later).not.toHaveBeenCalled();
    expect(getDatasetProvider()).toBeNull();
  });

  it('should accept raw domain clients and omitted domains without initialization', async () => {
    const json = createJsonProvider();
    const datasets = { ...json.datasets!, name: 'raw-datasets' };
    const tags = {
      ...json.tags!,
      name: 'raw-tags',
      initialize: () => ok(undefined),
    };
    expect(
      await initializeProvider({ datasets, evals: json.evals, tags })
    ).toEqual(ok(undefined));
    expect(getDatasetProvider()).toBe(datasets);
    expect(getEvalProvider()).toBe(json.evals);
    expect(getTagProvider()).toBe(tags);
    expect(await initializeProvider({})).toEqual(ok(undefined));
    expect(getDatasetProvider()).toBeNull();
    expect(getEvalProvider()).toBeNull();
    expect(getTagProvider()).toBeNull();
  });
});
