import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { hostname, tmpdir } from 'node:os';
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
    await writeFile(
      path.join(root, '.viteval/item.json.lock', ownerName(process.pid)),
      ''
    );
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
    const rename = fs.rename;
    vi.spyOn(fs, 'rename').mockImplementation((...args) => {
      if (args[1] === path.join(root, '.viteval/item.json.lock')) {
        return Promise.reject(failure);
      }
      return rename(...args);
    });
    syncBuiltinESMExports();
    const operation = vi.fn(async () => 1);
    await expect(store.update('item.json', operation)).rejects.toBe(failure);
    expect(operation).not.toHaveBeenCalled();
    expect(await readdir(path.join(root, '.viteval'))).toEqual([]);
  });

  it('should recover a crashed process lock and serialize competing recovery writers', async () => {
    const lock = path.join(root, '.viteval/item.json.lock');
    const child = spawnSync(process.execPath, [
      '--input-type=module',
      '-e',
      `
      import { mkdirSync, writeFileSync } from 'node:fs';
      import { hostname } from 'node:os';
      import { randomUUID } from 'node:crypto';
      const lock = process.argv[1];
      mkdirSync(lock, { recursive: true });
      writeFileSync(lock + '/' + Buffer.from(hostname()).toString('base64url') + '.' + process.pid + '.' + randomUUID(), '');
      process.kill(process.pid, 'SIGKILL');
    `,
      lock,
    ]);
    expect(child.signal).toBe('SIGKILL');
    const store = createJsonStore(root);
    await store.write('item.json', 0);
    await Promise.all(
      Array.from({ length: 12 }, () =>
        store.update('item.json', async () => {
          const value = await store.read('item.json', z.number());
          await store.write('item.json', value! + 1);
        })
      )
    );
    expect(await store.read('item.json', z.number())).toBe(12);
    expect(await readdir(path.join(root, '.viteval'))).toEqual(['item.json']);
  });

  it('should recover an empty abandoned lock from the previous locking protocol', async () => {
    await mkdir(path.join(root, '.viteval/item.json.lock'), {
      recursive: true,
    });
    expect(await createJsonStore(root).update('item.json', async () => 1)).toBe(
      1
    );
  });

  it.each(['foreign', 'malformed', 'multiple', 'permission'])(
    'should preserve an unverified %s owner lock',
    async (kind) => {
      const lock = path.join(root, '.viteval/item.json.lock');
      await mkdir(lock, { recursive: true });
      const owner =
        kind === 'malformed'
          ? 'unknown'
          : ownerName(
              process.pid,
              kind === 'foreign' ? 'other-host' : hostname()
            );
      await writeFile(path.join(lock, owner), '');
      if (kind === 'multiple')
        await writeFile(path.join(lock, 'unexpected'), '');
      if (kind === 'permission')
        vi.spyOn(process, 'kill').mockImplementation(() => {
          throw Object.assign(new Error('not permitted'), { code: 'EPERM' });
        });
      vi.spyOn(Date, 'now').mockReturnValueOnce(0).mockReturnValue(5_000);
      await expect(
        createJsonStore(root).update('item.json', async () => 1)
      ).rejects.toThrow('Storage lock timed out');
      expect(await readFile(path.join(lock, owner), 'utf8')).toBe('');
    }
  );

  it('should clean staging directories when owner publication fails', async () => {
    const failure = Object.assign(new Error('disk full'), { code: 'ENOSPC' });
    vi.spyOn(fs, 'writeFile').mockRejectedValue(failure);
    syncBuiltinESMExports();
    await expect(
      createJsonStore(root).update('item.json', async () => 1)
    ).rejects.toBe(failure);
    expect(await readdir(path.join(root, '.viteval'))).toEqual([]);
  });

  it.each(['ENOENT', 'EACCES'])(
    'should handle a %s failure while inspecting an existing lock',
    async (code) => {
      const lock = path.join(root, '.viteval/item.json.lock');
      await mkdir(lock, { recursive: true });
      await writeFile(path.join(lock, ownerName(process.pid)), '');
      const failure = Object.assign(new Error('lock inspection failed'), {
        code,
      });
      const original = fs.readdir;
      vi.spyOn(fs, 'readdir').mockImplementation((...args) => {
        if (args[0] === lock) return Promise.reject(failure);
        return original(...args);
      });
      syncBuiltinESMExports();
      vi.spyOn(Date, 'now').mockReturnValueOnce(0).mockReturnValue(5_000);
      await expect(
        createJsonStore(root).update('item.json', async () => 1)
      ).rejects.toThrow(
        code === 'ENOENT' ? 'Storage lock timed out' : 'lock inspection failed'
      );
    }
  );

  it.each(['ENOENT', 'ENOTEMPTY', 'EEXIST', 'EACCES'])(
    'should handle a %s release race without recursively removing a replacement owner',
    async (code) => {
      const lock = path.join(root, '.viteval/item.json.lock');
      const replacement = ownerName(process.pid);
      const failure = Object.assign(new Error('release failed'), { code });
      const original = fs.rmdir;
      vi.spyOn(fs, 'rmdir').mockImplementation(async (...args) => {
        if (args[0] !== lock) return original(...args);
        if (code === 'ENOENT') await original(...args);
        else await writeFile(path.join(lock, replacement), '');
        throw failure;
      });
      syncBuiltinESMExports();
      const result = createJsonStore(root).update('item.json', async () => 1);
      if (code === 'EACCES') await expect(result).rejects.toBe(failure);
      else await expect(result).resolves.toBe(1);
      if (code !== 'ENOENT') expect(await readdir(lock)).toEqual([replacement]);
    }
  );

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

function ownerName(pid: number, host = hostname()) {
  return `${Buffer.from(host).toString('base64url')}.${pid}.${randomUUID()}`;
}
