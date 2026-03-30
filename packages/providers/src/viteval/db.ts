import path from 'node:path';
import { PrismaClient } from '#/generated/client';
import type { VitevalProviderOptions } from './types';

/**
 * Create a Prisma client configured for the specified database.
 *
 * @param options - Provider options determining database type and connection.
 * @returns A configured PrismaClient instance.
 */
export function createPrismaClient(
  options: VitevalProviderOptions
): PrismaClient {
  const url = resolveUrl(options);

  return new PrismaClient({
    datasourceUrl: url,
  });
}

/*
|------------------
| Internals
|------------------
*/

/**
 * Resolve the absolute path for a SQLite database file.
 *
 * @param options - Provider options.
 * @returns The absolute path to the SQLite database file.
 */
export function resolveSqlitePath(options: VitevalProviderOptions): string {
  if (options.database === 'postgres') {
    throw new Error('resolveSqlitePath should not be called for postgres');
  }

  const dbPath = options.path ?? path.join('.viteval', 'viteval.db');
  return path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);
}

function resolveUrl(options: VitevalProviderOptions): string {
  if (options.database === 'postgres') {
    return options.url;
  }

  return `file:${resolveSqlitePath(options)}`;
}
