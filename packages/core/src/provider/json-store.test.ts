import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { z } from 'zod';
import fs from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createJsonStore } from './json-store';

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'viteval-store-'));
});
afterEach(async () => {
  vi.restoreAllMocks();
  syncBuiltinESMExports();
  await rm(root, { recursive: true, force: true });
});

describe('createJsonStore', () => {
  it('should read, validate, list, and remove atomic documents', async () => {
    const store = createJsonStore(root);
    expect(await store.list('documents')).toEqual([]);
    expect(await store.read('missing.json', z.unknown())).toBeNull();
    await store.write('documents/b.json', { value: 2 });
    await store.write('documents/a.json', { value: 1 });
    await writeFile(
      path.join(root, '.viteval/documents/ignored.txt'),
      'ignored'
    );
    expect(await store.list('documents')).toEqual(['a.json', 'b.json']);
    expect(
      await store.read('documents/a.json', z.object({ value: z.number() }))
    ).toEqual({ value: 1 });
    await store.remove('documents/a.json');
    expect(await store.list('documents')).toEqual(['b.json']);
    expect(
      await readFile(path.join(root, '.viteval/documents/b.json'), 'utf8')
    ).toContain('2');
  });

  it('should reject paths outside the project storage directory', async () => {
    const store = createJsonStore(root);
    expect(() => store.write('../escape.json', {})).toThrow(
      'Invalid storage path'
    );
    await expect(store.read('../escape.json', z.unknown())).rejects.toThrow(
      'Invalid storage path'
    );
    await expect(store.list('../escape')).rejects.toThrow(
      'Invalid storage path'
    );
  });

  it('should wrap malformed JSON, schema errors, and non-Error schema failures', async () => {
    const store = createJsonStore(root);
    await store.write('value.json', 1);
    await expect(store.read('value.json', z.string())).rejects.toThrow(
      'Invalid JSON file value.json'
    );
    await expect(
      store.read(
        'value.json',
        z.number().transform(() => {
          throw 'schema rejected';
        })
      )
    ).rejects.toThrow('schema rejected');
    await writeFile(path.join(root, '.viteval/value.json'), '{broken');
    await expect(store.read('value.json', z.unknown())).rejects.toThrow(
      'Invalid JSON file'
    );
  });

  it('should surface directory and lock filesystem failures', async () => {
    const store = createJsonStore(root);
    await store.write('blocked.json', {});
    await expect(store.list('blocked.json')).rejects.toMatchObject({
      code: 'ENOTDIR',
    });
    await store.write('parent.json', {});
    await expect(
      store.update('parent.json/child.json', async () => undefined)
    ).rejects.toMatchObject({
      code: expect.stringMatching(/^(?:ENOTDIR|EEXIST)$/),
    });
  });

  it('should expire an existing lock without removing another writer lock', async () => {
    const store = createJsonStore(root);
    await mkdir(path.join(root, '.viteval/item.json.lock'), {
      recursive: true,
    });
    vi.spyOn(Date, 'now').mockReturnValueOnce(0).mockReturnValue(5_000);
    await expect(store.update('item.json', async () => 1)).rejects.toThrow(
      'Storage lock timed out'
    );
    expect(await store.list('.')).toEqual([]);
  });

  it('should propagate lock creation permission failures without running the operation', async () => {
    const store = createJsonStore(root);
    const failure = Object.assign(new Error('permission denied'), {
      code: 'EACCES',
    });
    const mkdir = fs.mkdir;
    vi.spyOn(fs, 'mkdir').mockImplementation((...args) => {
      if (args[0] === path.join(root, '.viteval/item.json.lock')) {
        return Promise.reject(failure);
      }
      return mkdir(...args);
    });
    syncBuiltinESMExports();
    const operation = vi.fn(async () => 1);
    await expect(store.update('item.json', operation)).rejects.toBe(failure);
    expect(operation).not.toHaveBeenCalled();
  });

  it('should serialize updates and release locks after a rejected operation', async () => {
    const store = createJsonStore(root);
    await expect(
      store.update('item.json', async () => {
        throw new Error('operation failed');
      })
    ).rejects.toThrow('operation failed');
    expect(await store.update('item.json', async () => 'recovered')).toBe(
      'recovered'
    );
    const events: string[] = [];
    const started = Promise.withResolvers<void>();
    const first = store.update('item.json', async () => {
      events.push('start');
      started.resolve();
      await new Promise((resolve) => setTimeout(resolve, 25));
      events.push('finish');
    });
    await started.promise;
    await Promise.all([
      first,
      store.update('item.json', async () => {
        events.push('next');
      }),
    ]);
    expect(events).toEqual(['start', 'finish', 'next']);
  });
});
