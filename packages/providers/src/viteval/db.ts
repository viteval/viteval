import path from 'node:path';
import type { PrismaClient } from '#/generated/prisma/client';
import { attemptAsync } from 'massaman/control';
import type { VitevalPostgresOptions, VitevalSqliteOptions } from './types';

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
  options: VitevalSqliteOptions | VitevalPostgresOptions
): Promise<PrismaClient> {
  const created = await attemptAsync(async () => {
    const { PrismaClient } = await import('#/generated/prisma/client');
    if (options.database === 'postgres') {
      const { PrismaPg } = await import('@prisma/adapter-pg');
      return new PrismaClient({ adapter: new PrismaPg(options.url) });
    }
    const { PrismaBetterSqlite3 } =
      await import('@prisma/adapter-better-sqlite3');
    return new PrismaClient({
      adapter: new PrismaBetterSqlite3({ url: resolveSqlitePath(options) }),
    });
  });
  if (!created.ok) {
    const packages =
      options.database === 'postgres'
        ? '@prisma/client @prisma/adapter-pg pg'
        : '@prisma/client @prisma/adapter-better-sqlite3 better-sqlite3';
    throw new Error(
      `Cannot initialize ${options.database ?? 'sqlite'} provider. Install ${packages}. ${created.error.message}`,
      { cause: created.error }
    );
  }
  return created.value;
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
export function resolveSqlitePath(
  options: VitevalSqliteOptions | VitevalPostgresOptions
): string {
  const dbPath =
    ('path' in options ? options.path : undefined) ??
    path.join('.viteval', 'viteval.db');
  return path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);
}
