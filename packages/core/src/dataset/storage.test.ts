import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { err, ok } from 'massaman/control';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createJsonProvider } from '#/provider/json';
import type { DatasetProvider } from '#/provider/types';
import { createDatasetStorage } from './storage';

let root: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'viteval-storage-contract-'));
});
afterEach(async () => {
  globalThis.__viteval_datasetProvider = undefined;
  await rm(root, { recursive: true, force: true });
});

describe('createDatasetStorage', () => {
  function storage(provider?: DatasetProvider) {
    return createDatasetStorage<string, string, { context?: string }>({
      root,
      name: 'contract',
      description: 'Storage contract',
      storage: 'local',
      provider,
    });
  }

  it('should roundtrip data through fallback JSON storage and preserve extra fields', async () => {
    const target = storage();
    expect(await target.exists()).toMatchObject({ ok: true, value: false });
    expect(await target.load()).toMatchObject({ ok: true, value: null });
    const items = [{ input: 'q', expected: 'a', context: 'reference' }];
    expect(await target.save(items)).toMatchObject({ ok: true });
    expect(await target.exists()).toMatchObject({ ok: true, value: true });
    expect(await target.load()).toMatchObject({ ok: true, value: items });
    expect(
      await target.save([{ input: 'new', expected: 'answer' }])
    ).toMatchObject({ ok: true });
    expect(await target.load()).toMatchObject({
      ok: true,
      value: [{ input: 'new', expected: 'answer' }],
    });
  });

  it('should use initialized storage when no provider is supplied', async () => {
    globalThis.__viteval_datasetProvider = createJsonProvider({
      root,
    }).datasets;
    expect(await storage().save([{ input: 'q', expected: 'a' }])).toMatchObject(
      { ok: true }
    );
    expect(await storage().load()).toMatchObject({
      ok: true,
      value: [{ input: 'q', expected: 'a' }],
    });
  });

  it('should prefer explicit storage over initialized storage', async () => {
    globalThis.__viteval_datasetProvider = {
      ...createJsonProvider({ root }).datasets!,
      get: async () => err('initialized provider should not run'),
    };
    expect(
      await storage(createJsonProvider({ root }).datasets).load()
    ).toMatchObject({ ok: true, value: null });
  });

  it('should propagate lookup errors from every storage operation', async () => {
    const failure = err('lookup failed');
    const target = storage({
      ...createJsonProvider({ root }).datasets!,
      get: async () => failure,
    });
    expect(await target.exists()).toBe(failure);
    expect(await target.load()).toBe(failure);
    expect(await target.save([])).toBe(failure);
  });

  it('should propagate item-read errors without returning partial cases', async () => {
    const provider = createJsonProvider({ root }).datasets!;
    await provider.create({ name: 'contract', items: [] });
    const failure = err('items failed');
    expect(
      await storage({ ...provider, getItems: async () => failure }).load()
    ).toBe(failure);
  });

  it('should propagate create errors without reporting a successful save', async () => {
    const failure = err('create failed');
    expect(
      await storage({
        ...createJsonProvider({ root }).datasets!,
        create: async () => failure,
      }).save([])
    ).toBe(failure);
  });

  it('should reject unsupported overwrite and preserve saved data', async () => {
    const provider = createJsonProvider({ root }).datasets!;
    await provider.create({
      name: 'contract',
      items: [{ input: 'original', expected: 'a' }],
    });
    const { replaceItems: _replace, ...appendOnly } = provider;
    expect(await storage(appendOnly).save([])).toMatchObject({
      ok: false,
      error: { message: 'Provider cannot overwrite dataset contract' },
    });
    expect(await storage(provider).load()).toMatchObject({
      ok: true,
      value: [{ input: 'original' }],
    });
  });

  it('should return replacement failures unchanged', async () => {
    const provider = createJsonProvider({ root }).datasets!;
    await provider.create({ name: 'contract' });
    const failure = err('replacement failed');
    expect(
      await storage({ ...provider, replaceItems: async () => failure }).save([])
    ).toBe(failure);
  });

  it('should support providers returning empty item arrays', async () => {
    const provider = createJsonProvider({ root }).datasets!;
    await provider.create({ name: 'contract' });
    expect(
      await storage({ ...provider, getItems: async () => ok([]) }).load()
    ).toMatchObject({ ok: true, value: [] });
  });
});
