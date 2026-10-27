import { readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createPrismaClient, resolveSqlitePath } from './db';
import { viteval } from './provider';

describe('database-specific Prisma clients', () => {
  it('should resolve default, relative, and absolute SQLite paths', () => {
    expect(resolveSqlitePath({ database: 'sqlite' })).toBe(
      path.resolve('.viteval/viteval.db')
    );
    expect(resolveSqlitePath({ database: 'sqlite', path: 'relative.db' })).toBe(
      path.resolve('relative.db')
    );
    const absolute = path.resolve('absolute.db');
    expect(resolveSqlitePath({ database: 'sqlite', path: absolute })).toBe(
      absolute
    );
    expect(
      resolveSqlitePath({
        database: 'postgres',
        url: 'postgres://localhost/db',
      })
    ).toBe(path.resolve('.viteval/viteval.db'));
  });
  it('should generate the same models for SQLite and PostgreSQL', async () => {
    const sqlite = await readFile(
      new URL('../../prisma/schema.prisma', import.meta.url),
      'utf8'
    );
    const postgres = await readFile(
      new URL('../../prisma/postgres.prisma', import.meta.url),
      'utf8'
    );
    expect(postgres.slice(postgres.indexOf('model Dataset'))).toBe(
      sqlite.slice(sqlite.indexOf('model Dataset'))
    );
    expect(postgres).toContain('provider = "postgresql"');
    expect(postgres).toContain('output = "../src/generated/prisma-postgres"');
  });

  it('should construct and close a PostgreSQL client without a SQLite adapter mismatch', async () => {
    const client = await createPrismaClient({
      database: 'postgres',
      url: 'postgres://fixture:fixture@127.0.0.1:1/fixture',
    });
    await client.$disconnect();
  });

  it('should return a connection failure through Result and close cleanly', async () => {
    const server = createServer();
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve)
    );
    const address = server.address();
    if (!address || typeof address === 'string')
      throw new Error('Missing fixture port');
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
    const provider = viteval({
      database: 'postgres',
      url: `postgres://fixture:fixture@127.0.0.1:${address.port}/fixture?connect_timeout=1`,
    });
    try {
      const result = await provider.initialize();
      expect(result).toMatchObject({ ok: false });
      if (result.ok) throw new Error('Expected a refused connection');
      expect(result.error.message).not.toContain('not compatible');
      expect(provider.datasets).toBeUndefined();
      expect(provider.evals).toBeUndefined();
      expect(provider.tags).toBeUndefined();
    } finally {
      expect(await provider.close()).toMatchObject({ ok: true });
    }
  });
});
