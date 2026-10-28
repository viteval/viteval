import { randomUUID } from 'node:crypto';
import {
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  rmdir,
  writeFile,
} from 'node:fs/promises';
import { hostname } from 'node:os';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { writeJsonAtomic } from '@viteval/internal';
import { z } from 'zod';

/**
 * Create atomic JSON storage scoped to a project.
 * @param root - Project root.
 * @returns Validated reads and serialized writes.
 * @example const store = createJsonStore(process.cwd());
 */
export function createJsonStore(root: string) {
  const directory = path.resolve(root, '.viteval');
  function resolve(file: string) {
    const destination = path.resolve(directory, file);
    const relative = path.relative(directory, destination);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`Invalid storage path: ${file}`);
    }
    return destination;
  }
  return {
    root: path.resolve(root),
    async read<T>(file: string, schema: z.ZodType<T>): Promise<T | null> {
      try {
        const raw: unknown = JSON.parse(await readFile(resolve(file), 'utf8'));
        return schema.parse(raw);
      } catch (error) {
        if (isMissing(error)) return null;
        throw new Error(
          `Invalid JSON file ${file}: ${error instanceof Error ? error.message : String(error)}`,
          { cause: error }
        );
      }
    },
    async list(folder: string) {
      try {
        return (await readdir(resolve(folder)))
          .filter((file) => file.endsWith('.json'))
          .toSorted();
      } catch (error) {
        if (isMissing(error)) return [];
        throw error;
      }
    },
    write(file: string, value: unknown) {
      return writeJsonAtomic({ filePath: resolve(file), value });
    },
    async remove(file: string) {
      await rm(resolve(file), { force: true });
    },
    async update<T>(file: string, operation: () => Promise<T>): Promise<T> {
      const lock = `${resolve(file)}.lock`;
      await mkdir(path.dirname(lock), { recursive: true });
      const owner = `${Buffer.from(hostname()).toString('base64url')}.${process.pid}.${randomUUID()}`;
      const staging = `${lock}.${owner}`;
      const deadline = Date.now() + 5_000;
      await mkdir(staging);
      try {
        await writeFile(path.join(staging, owner), '');
        while (true) {
          try {
            // Publish the owner with the lock: an acquiring writer is never ownerless.
            await rename(staging, lock);
            break;
          } catch (error) {
            if (!hasCode(error, 'EEXIST') && !hasCode(error, 'ENOTEMPTY'))
              throw error;
            await recoverLock(lock);
            if (Date.now() >= deadline)
              throw new Error(
                `Storage lock timed out: ${file}. Another writer may still be active.`
              );
            await setTimeout(10);
          }
        }
        try {
          return await operation();
        } finally {
          await removeOwnerLock({ lock, owner });
        }
      } finally {
        await rm(staging, { recursive: true, force: true });
      }
    },
  };
}

export type JsonStore = ReturnType<typeof createJsonStore>;

function isMissing(error: unknown) {
  return hasCode(error, 'ENOENT');
}

function hasCode(error: unknown, code: string) {
  return error instanceof Error && 'code' in error && error.code === code;
}

async function recoverLock(lock: string): Promise<void> {
  try {
    const owners = await readdir(lock);
    if (owners.length !== 1) return;
    const owner = owners[0]!;
    const match = /^([\w-]+)\.([1-9]\d*)\.([\da-f-]{36})$/.exec(owner);
    if (!match || match[1] !== Buffer.from(hostname()).toString('base64url'))
      return;
    try {
      process.kill(Number(match[2]), 0);
      return;
    } catch (error) {
      if (!hasCode(error, 'ESRCH')) return;
    }
    // Remove only this dead owner's marker. A replacement has a unique marker,
    // so rmdir cannot delete a new writer's nonempty lock during concurrent recovery.
    await removeOwnerLock({ lock, owner });
  } catch (error) {
    if (!isMissing(error)) throw error;
  }
}

async function removeOwnerLock({
  lock,
  owner,
}: {
  lock: string;
  owner: string;
}): Promise<void> {
  try {
    await rm(path.join(lock, owner), { force: true });
    await rmdir(lock);
  } catch (error) {
    if (
      !isMissing(error) &&
      !hasCode(error, 'ENOTEMPTY') &&
      !hasCode(error, 'EEXIST')
    )
      throw error;
  }
}
