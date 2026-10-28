import { afterEach, describe, expect, it, vi } from 'vitest';
import { braintrust } from './braintrust/provider';
import { gcs } from './gcs';
import { langfuse } from './langfuse/provider';
import { s3 } from './s3';
import { voltops } from './voltops/provider';
import { createPrismaClient } from './viteval/db';

const modules = [
  '@braintrust/api',
  '@google-cloud/storage',
  '@langfuse/client',
  '@aws-sdk/client-s3',
  '@voltagent/sdk',
  '@prisma/adapter-better-sqlite3',
  '@prisma/adapter-pg',
];
afterEach(() => {
  for (const module of modules) vi.doUnmock(module);
});

describe('optional provider dependencies', () => {
  it('should preserve SDK construction errors as failed Results', async () => {
    vi.doMock('@braintrust/api', () => ({
      default: vi.fn(function () {
        throw new Error('SDK construction failed');
      }),
    }));
    expect(
      await braintrust({ project: 'project', apiKey: 'fixture' }).initialize()
    ).toMatchObject({
      ok: false,
      error: { message: 'SDK construction failed' },
    });
  });
  it.each([
    {
      module: '@braintrust/api',
      create: () => braintrust({ project: 'project', apiKey: 'fixture' }),
      message: 'requires the "@braintrust/api" package',
    },
    {
      module: '@google-cloud/storage',
      create: () => gcs({ bucket: 'bucket' }),
      message: 'Install @google-cloud/storage',
    },
    {
      module: '@langfuse/client',
      create: () => langfuse({ publicKey: 'fixture', secretKey: 'fixture' }),
      message: 'Install @langfuse/client',
    },
    {
      module: '@aws-sdk/client-s3',
      create: () => s3({ bucket: 'bucket' }),
      message: 'Install @aws-sdk/client-s3',
    },
    {
      module: '@voltagent/sdk',
      create: () => voltops({ publicKey: 'fixture', secretKey: 'fixture' }),
      message: 'Install @voltagent/sdk',
    },
  ])(
    'should explain missing $module dependencies through Result',
    async ({ module, create, message }) => {
      vi.doMock(module, () => {
        throw new Error('Optional peer is not installed');
      });
      const provider = create();
      const result = await provider.initialize();
      expect(result).toMatchObject({
        ok: false,
        error: { message: expect.stringContaining(message) },
      });
      expect(provider.datasets).toBeUndefined();
      expect(provider.evals).toBeUndefined();
      await provider.close();
    }
  );
  it.each(['sqlite', 'postgres'] as const)(
    'should identify missing %s database drivers',
    async (database) => {
      vi.doMock(
        database === 'sqlite'
          ? '@prisma/adapter-better-sqlite3'
          : '@prisma/adapter-pg',
        () => {
          throw new Error('Optional driver is not installed');
        }
      );
      const options =
        database === 'sqlite'
          ? { database }
          : { database, url: 'postgres://localhost/db' };
      await expect(createPrismaClient(options)).rejects.toThrow(
        `Cannot initialize ${database} provider. Install @prisma/client`
      );
    }
  );
  it('should identify missing SQLite drivers when the database type is omitted', async () => {
    vi.doMock('@prisma/adapter-better-sqlite3', () => {
      throw new Error('Optional driver is not installed');
    });
    await expect(createPrismaClient({})).rejects.toThrow(
      'Cannot initialize sqlite provider. Install'
    );
  });
});
