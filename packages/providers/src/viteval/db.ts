import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import type { VitevalProviderOptions } from './types';

/**
 * Create a Prisma client configured for the specified database.
 *
 * Prisma 7 requires a driver adapter instead of a connection URL.
 * Adapters are dynamically imported so the optional Postgres peer
 * dependency is only loaded when actually needed.
 *
 * @param options - Provider options determining database type and connection.
 * @returns A configured PrismaClient instance.
 */
export async function createPrismaClient(
  options: VitevalProviderOptions
): Promise<PrismaClient> {
  if (options.database === 'postgres') {
    const { PrismaPg } = await import('@prisma/adapter-pg');
    return new PrismaClient({ adapter: new PrismaPg(options.url) });
  }

  const { PrismaBetterSqlite3 } =
    await import('@prisma/adapter-better-sqlite3');
  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: resolveSqlitePath(options) }),
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
