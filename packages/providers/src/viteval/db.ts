import path from 'node:path';
import { PrismaClient } from '#/generated/client';
import type { VitevalProviderOptions } from './types';

/**
 * Create a Prisma client configured for the specified database.
 *
 * @param options - Provider options determining database type and connection.
 * @returns A configured PrismaClient instance.
 */
export function createPrismaClient(options: VitevalProviderOptions): PrismaClient {
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

function resolveUrl(options: VitevalProviderOptions): string {
  if (options.database === 'postgres') {
    return options.url;
  }

  const dbPath = options.path ?? path.join('.viteval', 'viteval.db');
  const absolutePath = path.isAbsolute(dbPath)
    ? dbPath
    : path.resolve(process.cwd(), dbPath);

  return `file:${absolutePath}`;
}
