import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';
import type { VitevalProviderOptions } from './types';

/**
 * Create a Prisma client configured for the specified database.
 *
 * Prisma 7 requires a driver adapter instead of a connection URL.
 * Uses `@prisma/adapter-better-sqlite3` for SQLite and
 * `@prisma/adapter-pg` for PostgreSQL.
 *
 * @param options - Provider options determining database type and connection.
 * @returns A configured PrismaClient instance.
 */
export function createPrismaClient(
  options: VitevalProviderOptions
): PrismaClient {
  const adapter =
    options.database === 'postgres'
      ? new PrismaPg(options.url)
      : new PrismaBetterSqlite3({ url: resolveSqlitePath(options) });

  return new PrismaClient({ adapter });
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
