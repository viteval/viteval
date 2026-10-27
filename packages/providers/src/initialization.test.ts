import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBraintrustClient } from './braintrust/client';
import { gcs } from './gcs';
import { langfuse } from './langfuse/provider';
import { s3 } from './s3';
import { voltops } from './voltops/provider';
import { createPrismaClient, resolveSqlitePath } from './viteval/db';

afterEach(() => vi.unstubAllEnvs());

describe('provider initialization validation', () => {
  it.each(['', ' '])(
    'should reject blank S3 and GCS buckets %s',
    async (bucket) => {
      expect(await s3({ bucket }).initialize()).toMatchObject({
        ok: false,
        error: { message: 'S3 bucket is required' },
      });
      expect(await gcs({ bucket }).initialize()).toMatchObject({
        ok: false,
        error: { message: 'GCS bucket is required' },
      });
    }
  );
  it.each([0, -1, 1.5, NaN, Infinity])(
    'should reject invalid conflict budgets %s before connecting',
    async (maxAttempts) => {
      expect(
        await s3({ bucket: 'bucket', maxAttempts }).initialize()
      ).toMatchObject({
        ok: false,
        error: { message: 'maxAttempts must be a positive integer' },
      });
    }
  );
  it.each([
    { publicKey: '', secretKey: 'secret' },
    { publicKey: 'public', secretKey: ' ' },
  ])('should reject missing hosted credentials %s', async (options) => {
    expect(await langfuse(options).initialize()).toMatchObject({
      ok: false,
      error: { message: 'Langfuse requires publicKey and secretKey' },
    });
    expect(await voltops(options).initialize()).toMatchObject({
      ok: false,
      error: { message: 'VoltOps requires publicKey and secretKey' },
    });
  });
  it('should defer Braintrust authentication until the first SDK request', async () => {
    vi.stubEnv('BRAINTRUST_API_KEY', undefined);
    const getClient = createBraintrustClient({ project: 'project' });
    expect(await getClient()).toMatchObject({ ok: true });
  });
  it('should resolve default and relative SQLite paths without connecting', () => {
    expect(resolveSqlitePath({ database: 'sqlite' })).toBe(
      `${process.cwd()}/.viteval/viteval.db`
    );
    expect(resolveSqlitePath({ database: 'sqlite', path: 'relative.db' })).toBe(
      `${process.cwd()}/relative.db`
    );
    expect(
      resolveSqlitePath({
        database: 'postgres',
        url: 'postgres://localhost/db',
      })
    ).toBe(`${process.cwd()}/.viteval/viteval.db`);
  });
  it('should initialize the default Langfuse host without making requests', async () => {
    vi.stubEnv('LANGFUSE_BASE_URL', undefined);
    const provider = langfuse({ publicKey: 'fixture', secretKey: 'fixture' });
    try {
      expect(await provider.initialize()).toMatchObject({ ok: true });
    } finally {
      await provider.close();
    }
  });
  it('should construct the PostgreSQL client without opening a connection', async () => {
    const client = await createPrismaClient({
      database: 'postgres',
      url: 'postgres://fixture:fixture@127.0.0.1:1/fixture',
    });
    await client.$disconnect();
  });
});
