import { mkdir, readFile, readdir, rm } from 'node:fs/promises';
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
      const deadline = Date.now() + 5_000;
      while (true) {
        try {
          await mkdir(lock);
          break;
        } catch (error) {
          if (
            !(
              error instanceof Error &&
              'code' in error &&
              error.code === 'EEXIST'
            )
          )
            throw error;
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
        await rm(lock, { recursive: true, force: true });
      }
    },
  };
}

export type JsonStore = ReturnType<typeof createJsonStore>;

function isMissing(error: unknown) {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}
