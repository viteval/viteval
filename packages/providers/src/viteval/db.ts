import path from 'node:path';
import type { Prisma, PrismaClient } from '#/generated/prisma/client';
import { attemptAsync } from 'massaman/control';
import type { VitevalPostgresOptions, VitevalSqliteOptions } from './types';

type DatabaseModels = {
  dataset: Pick<
    PrismaClient['dataset'],
    'create' | 'delete' | 'findUnique' | 'findMany' | 'update'
  >;
  datasetItem: Pick<
    PrismaClient['datasetItem'],
    'deleteMany' | 'createMany' | 'findFirst' | 'findMany'
  >;
  evalRun: Pick<
    PrismaClient['evalRun'],
    'create' | 'update' | 'findUnique' | 'findMany'
  >;
  evalRunResult: Pick<PrismaClient['evalRunResult'], 'create' | 'createMany'>;
  tag: Pick<PrismaClient['tag'], 'create' | 'update' | 'delete' | 'findMany'>;
  tagging: Pick<PrismaClient['tagging'], 'upsert' | 'findMany' | 'deleteMany'>;
};

/** Database-neutral subset shared by the separately generated clients. */
export interface DatabaseClient
  extends
    DatabaseModels,
    Pick<PrismaClient, '$disconnect' | '$executeRawUnsafe'> {
  $transaction(operations: Prisma.PrismaPromise<unknown>[]): Promise<unknown>;
  $transaction(
    operation: (client: DatabaseModels) => Promise<void>
  ): Promise<void>;
}

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
): Promise<DatabaseClient> {
  const created = await attemptAsync(async () => {
    if (options.database === 'postgres') {
      const { PrismaClient } =
        await import('#/generated/prisma-postgres/client');
      const { PrismaPg } = await import('@prisma/adapter-pg');
      return new PrismaClient({
        adapter: new PrismaPg({ connectionString: options.url }),
      });
    }
    const { PrismaClient } = await import('#/generated/prisma/client');
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
