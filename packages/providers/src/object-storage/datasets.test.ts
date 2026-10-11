import { createHash } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import { CRC32C } from '@google-cloud/storage';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DatasetProvider, Provider } from '@viteval/core';
import { gcs } from '#/gcs';
import { s3 } from '#/s3';
import { requireRecord } from '#/remote-record';

interface StoredObject {
  body: Buffer;
  version: string;
}
interface RequestRecord {
  method: string;
  key: string;
  condition: string | undefined;
  body: Buffer;
}
let server: Server;
let url: string;
let providers: Provider[];
let objects: Map<string, StoredObject>;
let requests: RequestRecord[];
let counter: bigint;
let conflictBudget: number;
let failure: 'version' | 'catalog' | undefined;
let lostResponse: boolean;
let omitToken: boolean;
let badCatalogChecksum: boolean;

beforeEach(async () => {
  providers = [];
  objects = new Map();
  requests = [];
  counter = 9007199254740993123n;
  conflictBudget = 0;
  failure = undefined;
  lostResponse = false;
  omitToken = false;
  badCatalogChecksum = false;
  server = createServer(async (request, response) => {
    const parsed = new URL(request.url ?? '/', 'http://localhost');
    const isGoogle = parsed.pathname.includes('/storage/v1/');
    const isUpload = parsed.pathname.startsWith('/upload/storage/v1/');
    const key = isGoogle
      ? isUpload
        ? (parsed.searchParams.get('name') ?? '')
        : decodeURIComponent(parsed.pathname.split('/o/')[1] ?? '')
      : decodeURIComponent(parsed.pathname.replace(/^\/bucket\//, ''));
    const method = request.method ?? 'GET';
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const raw = Buffer.concat(chunks);
    const body = isUpload
      ? googleBody({
          body: raw,
          contentType: String(request.headers['content-type']),
        })
      : raw;
    const condition = isGoogle
      ? (parsed.searchParams.get('ifGenerationMatch') ?? undefined)
      : typeof request.headers['if-match'] === 'string'
        ? request.headers['if-match']
        : request.headers['if-none-match'] === '*'
          ? '0'
          : undefined;
    requests.push({ method, key, condition, body });
    const current = objects.get(key);
    function reject(status: number, code: string) {
      response.statusCode = status;
      response.setHeader(
        'Content-Type',
        isGoogle ? 'application/json' : 'application/xml'
      );
      response.end(
        isGoogle
          ? JSON.stringify({
              error: {
                code: status,
                message: code,
                errors: [{ reason: code, message: code }],
              },
            })
          : `<Error><Code>${code}</Code><Message>${code}</Message></Error>`
      );
    }
    if (method === 'GET') {
      if (!current) {
        reject(404, 'NoSuchKey');
        return;
      }
      if (isGoogle && parsed.searchParams.get('alt') !== 'media') {
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify(googleMetadata({ key, object: current })));
        return;
      }
      response.setHeader('Content-Type', 'application/json');
      if (!omitToken)
        response.setHeader(
          isGoogle ? 'x-goog-generation' : 'ETag',
          current.version
        );
      if (isGoogle) {
        response.setHeader('x-goog-stored-content-encoding', 'identity');
        response.setHeader(
          'x-goog-hash',
          `crc32c=${checksum(current.body)},md5=${createHash('md5').update(current.body).digest('base64')}`
        );
      }
      response.end(current.body);
      return;
    }
    if (method === 'DELETE') {
      if (!condition || condition !== current?.version) {
        reject(412, 'PreconditionFailed');
        return;
      }
      objects.delete(key);
      response.statusCode = 204;
      response.end();
      return;
    }
    if (method !== 'PUT' && !isUpload) {
      reject(400, 'UnexpectedMethod');
      return;
    }
    if (failure === 'version' && key.includes('/versions/')) {
      reject(503, 'ServiceUnavailable');
      return;
    }
    if (failure === 'catalog' && key.endsWith('/index.json')) {
      reject(503, 'ServiceUnavailable');
      return;
    }
    if (key.endsWith('/index.json') && conflictBudget > 0) {
      conflictBudget -= 1;
      reject(412, 'PreconditionFailed');
      return;
    }
    if (!condition) {
      reject(400, 'MissingPrecondition');
      return;
    }
    if (
      condition === '0' ? current !== undefined : current?.version !== condition
    ) {
      reject(412, 'PreconditionFailed');
      return;
    }
    counter += 1n;
    const version = isGoogle ? counter.toString() : `"${counter}"`;
    const stored = { body, version };
    objects.set(key, stored);
    if (lostResponse && key.endsWith('/index.json')) {
      lostResponse = false;
      response.destroy();
      return;
    }
    if (isGoogle) {
      response.setHeader('Content-Type', 'application/json');
      const metadata = googleMetadata({ key, object: stored });
      response.end(
        JSON.stringify(
          badCatalogChecksum && key.endsWith('/index.json')
            ? { ...metadata, crc32c: 'AAAAAA==' }
            : metadata
        )
      );
    } else {
      response.setHeader('ETag', version);
      response.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('Missing fixture address');
  url = `http://127.0.0.1:${address.port}`;
});
afterEach(async () => {
  for (const provider of providers) await provider.close();
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve()))
  );
});

describe.each(['s3', 'gcs'] as const)(
  '%s dataset storage SDK contract',
  (backend) => {
    async function initialized(
      params: { prefix?: string; maxAttempts?: number } = {}
    ): Promise<DatasetProvider> {
      const options = { bucket: 'bucket', ...params };
      const provider =
        backend === 's3'
          ? s3({
              ...options,
              clientOptions: {
                region: 'us-east-1',
                endpoint: url,
                forcePathStyle: true,
                credentials: {
                  accessKeyId: 'fixture',
                  secretAccessKey: 'fixture',
                },
                maxAttempts: 1,
              },
            })
          : gcs({
              ...options,
              clientOptions: {
                apiEndpoint: url,
                projectId: 'fixture',
                useAuthWithCustomEndpoint: false,
                retryOptions: { autoRetry: false, maxRetries: 0 },
              },
            });
      providers.push(provider);
      const result = await provider.initialize();
      if (!result.ok) throw result.error;
      expect(provider.evals).toBeUndefined();
      expect(provider.tags).toBeUndefined();
      if (!provider.datasets) throw new Error('Missing dataset operations');
      return provider.datasets;
    }
    it('should read empty buckets without creating a catalog', async () => {
      const datasets = await initialized();
      expect(await datasets.list()).toMatchObject({ ok: true, value: [] });
      expect(await datasets.get({ name: 'missing' })).toMatchObject({
        ok: true,
        value: null,
      });
      expect(objects.size).toBe(0);
    });
    it('should preserve dataset metadata and extra item fields in a fresh provider', async () => {
      const datasets = await initialized();
      const created = await datasets.create({
        name: '../questions,release',
        description: 'Test data',
        metadata: { source: 'fixture' },
        items: [
          {
            input: { question: 'q' },
            expected: 'a',
            extra: { context: ['reference'] },
          },
        ],
      });
      if (!created.ok) throw created.error;
      const fresh = await initialized();
      expect(await fresh.get({ name: '../questions,release' })).toMatchObject({
        ok: true,
        value: {
          id: created.value.id,
          version: 1,
          itemCount: 1,
          metadata: { source: 'fixture' },
        },
      });
      expect(
        await fresh.getItems({ datasetId: created.value.id })
      ).toMatchObject({
        ok: true,
        value: [
          {
            id: `${created.value.id}:0`,
            ordinal: 0,
            input: { question: 'q' },
            expected: 'a',
            extra: { context: ['reference'] },
          },
        ],
      });
      expect(
        [...objects.keys()].every((key) => key.startsWith('viteval/datasets/'))
      ).toBe(true);
      const writes = requests.filter((request) => request.method !== 'GET');
      expect(writes.every((request) => request.condition !== undefined)).toBe(
        true
      );
    });
    it('should preserve renamed data when its former name is reused', async () => {
      const datasets = await initialized();
      const created = await datasets.create({
        name: 'original',
        items: [{ input: 'old', expected: 'a' }],
      });
      if (!created.ok) throw created.error;
      expect(
        await datasets.update({
          id: created.value.id,
          name: 'renamed',
          metadata: { revision: 2 },
        })
      ).toMatchObject({
        ok: true,
        value: { id: created.value.id, version: 2 },
      });
      const replacement = await datasets.create({
        name: 'original',
        items: [{ input: 'new', expected: 'a' }],
      });
      if (!replacement.ok) throw replacement.error;
      expect(replacement.value.id).not.toBe(created.value.id);
      expect(
        await datasets.getItems({ datasetId: created.value.id })
      ).toMatchObject({ ok: true, value: [{ input: 'old' }] });
      expect(
        await datasets.getItems({ datasetId: replacement.value.id })
      ).toMatchObject({ ok: true, value: [{ input: 'new' }] });
    });
    it('should replace items atomically and retain immutable prior versions', async () => {
      const datasets = await initialized();
      const created = await datasets.create({
        name: 'questions',
        items: [{ input: 'old', expected: 'a' }],
      });
      if (!created.ok) throw created.error;
      const prior = [...objects].find(([key]) => key.includes('/versions/'));
      expect(
        await datasets.replaceItems!({
          datasetId: created.value.id,
          items: [{ input: 'new', expected: 'b' }],
        })
      ).toMatchObject({ ok: true });
      expect(await datasets.get({ id: created.value.id })).toMatchObject({
        ok: true,
        value: { version: 2, itemCount: 1 },
      });
      expect(
        await datasets.getItems({ datasetId: created.value.id })
      ).toMatchObject({ ok: true, value: [{ input: 'new' }] });
      expect(prior && objects.get(prior[0])?.body).toEqual(prior?.[1].body);
    });
    it('should preserve additions from concurrent provider instances', async () => {
      const datasets = await initialized();
      const created = await datasets.create({ name: 'concurrent' });
      if (!created.ok) throw created.error;
      const clients = await Promise.all(
        Array.from({ length: 8 }, () => initialized())
      );
      const results = await Promise.all(
        clients.map((client, index) =>
          client.addItems({
            datasetId: created.value.id,
            items: [{ input: index, expected: index }],
          })
        )
      );
      expect(results.every((result) => result.ok)).toBe(true);
      const loaded = await datasets.getItems({ datasetId: created.value.id });
      if (!loaded.ok) throw loaded.error;
      expect(loaded.value.map((item) => item.input).toSorted()).toEqual([
        0, 1, 2, 3, 4, 5, 6, 7,
      ]);
      expect(await datasets.get({ id: created.value.id })).toMatchObject({
        ok: true,
        value: { version: 9 },
      });
    });
    it('should enforce unique names during concurrent rename and creation', async () => {
      const first = await initialized();
      const second = await initialized();
      const created = await first.create({ name: 'original' });
      if (!created.ok) throw created.error;
      const results = await Promise.all([
        first.update({ id: created.value.id, name: 'shared' }),
        second.create({ name: 'shared' }),
      ]);
      expect(results.filter((result) => result.ok)).toHaveLength(1);
      const listed = await first.list();
      if (!listed.ok) throw listed.error;
      expect(
        listed.value.filter((dataset) => dataset.name === 'shared')
      ).toHaveLength(1);
    });
    it('should leave the visible version intact after failed catalog publication', async () => {
      const datasets = await initialized();
      const created = await datasets.create({
        name: 'atomic',
        items: [{ input: 'old', expected: 'a' }],
      });
      if (!created.ok) throw created.error;
      failure = 'catalog';
      const writesBefore = requests.filter(
        (request) => request.method !== 'GET'
      ).length;
      expect(
        await datasets.replaceItems!({
          datasetId: created.value.id,
          items: [{ input: 'new', expected: 'a' }],
        })
      ).toMatchObject({ ok: false });
      expect(
        requests.filter((request) => request.method !== 'GET')
      ).toHaveLength(writesBefore + 2);
      expect(
        await datasets.getItems({ datasetId: created.value.id })
      ).toMatchObject({ ok: true, value: [{ input: 'old' }] });
      failure = undefined;
      expect(
        await datasets.addItems({
          datasetId: created.value.id,
          items: [{ input: 'added', expected: 'a' }],
        })
      ).toMatchObject({ ok: true });
    });
    it('should not publish a version whose upload failed', async () => {
      const datasets = await initialized();
      failure = 'version';
      expect(await datasets.create({ name: 'failed' })).toMatchObject({
        ok: false,
      });
      expect(objects.size).toBe(0);
      expect(
        requests.filter((request) => request.method !== 'GET')
      ).toHaveLength(1);
    });
    it('should bound catalog retries without changing visible records', async () => {
      const datasets = await initialized({ maxAttempts: 2 });
      conflictBudget = 10;
      expect(await datasets.create({ name: 'conflict' })).toMatchObject({
        ok: false,
      });
      expect(
        requests.filter(
          (request) =>
            request.method !== 'GET' && request.key.endsWith('/index.json')
        )
      ).toHaveLength(2);
      expect(await datasets.list()).toMatchObject({ ok: true, value: [] });
    });
    it('should not replay a catalog mutation after a committed response is lost', async () => {
      const datasets = await initialized();
      const created = await datasets.create({
        name: 'response-loss',
        items: [{ input: 'original', expected: 'a' }],
      });
      if (!created.ok) throw created.error;
      lostResponse = true;
      expect(
        await datasets.addItems({
          datasetId: created.value.id,
          items: [{ input: 'once', expected: 'a' }],
        })
      ).toMatchObject({ ok: false });
      expect(
        await datasets.getItems({ datasetId: created.value.id })
      ).toMatchObject({
        ok: true,
        value: [{ input: 'original' }, { input: 'once' }],
      });
      expect(await datasets.get({ id: created.value.id })).toMatchObject({
        ok: true,
        value: { version: 2 },
      });
    });
    it('should reject malformed catalogs and missing conditional tokens', async () => {
      const datasets = await initialized();
      await datasets.create({ name: 'existing' });
      omitToken = true;
      expect(await datasets.list()).toMatchObject({ ok: false });
      omitToken = false;
      const key = 'viteval/datasets/index.json';
      const current = objects.get(key)!;
      objects.set(key, { ...current, body: Buffer.from('{broken') });
      expect(await datasets.create({ name: 'other' })).toMatchObject({
        ok: false,
      });
      expect(objects.get(key)?.body.toString()).toBe('{broken');
    });
    it('should reject unsupported values and blank names before sending requests', async () => {
      const datasets = await initialized();
      expect(
        await datasets.create({
          name: 'bad',
          items: [{ input: 1n, expected: 'a' }],
        })
      ).toMatchObject({ ok: false });
      expect(await datasets.create({ name: ' ' })).toMatchObject({ ok: false });
      expect(requests).toHaveLength(0);
    });
    it('should paginate datasets and items and remove only the active catalog entry', async () => {
      const datasets = await initialized();
      await datasets.create({ name: 'alpha' });
      const created = await datasets.create({
        name: 'beta',
        items: [
          { input: 0, expected: 0 },
          { input: 1, expected: 1 },
        ],
      });
      if (!created.ok) throw created.error;
      expect(await datasets.list({ offset: 1, limit: 1 })).toMatchObject({
        ok: true,
        value: [{ name: 'beta' }],
      });
      expect(
        await datasets.getItems({
          datasetId: created.value.id,
          offset: 1,
          limit: 1,
        })
      ).toMatchObject({ ok: true, value: [{ input: 1, ordinal: 1 }] });
      expect(await datasets.delete({ id: created.value.id })).toMatchObject({
        ok: true,
      });
      expect(await datasets.get({ id: created.value.id })).toMatchObject({
        ok: true,
        value: null,
      });
      expect(
        await datasets.addItems({ datasetId: created.value.id, items: [] })
      ).toMatchObject({ ok: false });
      expect(
        [...objects.keys()].some((key) => key.includes('/versions/'))
      ).toBe(true);
    });
    it('should isolate catalogs by configured prefix', async () => {
      const first = await initialized({ prefix: '/first/' });
      const second = await initialized({ prefix: 'second' });
      await first.create({ name: 'shared' });
      expect(await second.get({ name: 'shared' })).toMatchObject({
        ok: true,
        value: null,
      });
      expect(
        [...objects.keys()].some((key) => key === 'first/index.json')
      ).toBe(true);
    });
    it('should reject invalid renames without publishing a new version', async () => {
      const datasets = await initialized();
      const first = await datasets.create({ name: 'first' });
      if (!first.ok) throw first.error;
      await datasets.create({ name: 'second' });
      const writes = requests.filter(
        (request) => request.method !== 'GET'
      ).length;
      for (const name of ['', ' ', 'second'])
        expect(
          await datasets.update({ id: first.value.id, name })
        ).toMatchObject({ ok: false });
      expect(
        requests.filter((request) => request.method !== 'GET')
      ).toHaveLength(writes);
      expect(await datasets.get({ id: first.value.id })).toMatchObject({
        ok: true,
        value: { name: 'first', version: 1 },
      });
    });
    it('should reject mismatched immutable versions before updating the catalog', async () => {
      const datasets = await initialized();
      const created = await datasets.create({
        name: 'mismatch',
        items: [{ input: 'q', expected: 'a' }],
      });
      if (!created.ok) throw created.error;
      const version = [...objects].find(([key]) => key.includes('/versions/'))!;
      const data = requireRecord(JSON.parse(version[1].body.toString()));
      objects.set(version[0], {
        ...version[1],
        body: Buffer.from(JSON.stringify({ ...data, id: 'other' })),
      });
      const catalogKey = 'viteval/datasets/index.json';
      const catalog = requireRecord(
        JSON.parse(objects.get(catalogKey)!.body.toString())
      );
      const catalogDatasets = catalog.datasets;
      if (!Array.isArray(catalogDatasets))
        throw new Error('Invalid test catalog');
      objects.set(catalogKey, {
        ...objects.get(catalogKey)!,
        body: Buffer.from(
          JSON.stringify({
            ...catalog,
            datasets: catalogDatasets.map((value) => ({
              ...requireRecord(value),
              digest: createHash('sha256')
                .update(objects.get(version[0])!.body)
                .digest('hex'),
            })),
          })
        ),
      });
      const writes = requests.filter(
        (request) => request.method !== 'GET'
      ).length;
      expect(
        await datasets.getItems({ datasetId: created.value.id })
      ).toMatchObject({ ok: false });
      expect(
        await datasets.addItems({ datasetId: created.value.id, items: [] })
      ).toMatchObject({ ok: false });
      expect(
        requests.filter((request) => request.method !== 'GET')
      ).toHaveLength(writes);
    });
    it('should detect rewritten snapshot contents even when its schema still matches', async () => {
      const datasets = await initialized();
      const created = await datasets.create({
        name: 'integrity',
        items: [{ input: 'original', expected: 'a' }],
      });
      if (!created.ok) throw created.error;
      const version = [...objects].find(([key]) => key.includes('/versions/'))!;
      const data = requireRecord(JSON.parse(version[1].body.toString()));
      objects.set(version[0], {
        ...version[1],
        body: Buffer.from(
          JSON.stringify({
            ...data,
            data: [{ input: 'rewritten', expected: 'a' }],
          })
        ),
      });
      expect(
        await datasets.getItems({ datasetId: created.value.id })
      ).toMatchObject({ ok: false });
      expect(
        await datasets.replaceItems!({ datasetId: created.value.id, items: [] })
      ).toMatchObject({ ok: false });
    });
    if (backend === 'gcs') {
      it('should prevent SDK checksum cleanup from deleting a newly committed catalog', async () => {
        const datasets = await initialized();
        const created = await datasets.create({
          name: 'checksum',
          items: [{ input: 'original', expected: 'a' }],
        });
        if (!created.ok) throw created.error;
        badCatalogChecksum = true;
        expect(
          await datasets.addItems({
            datasetId: created.value.id,
            items: [{ input: 'committed', expected: 'a' }],
          })
        ).toMatchObject({ ok: false });
        expect(
          requests.some(
            (request) =>
              request.method === 'DELETE' && request.condition !== undefined
          )
        ).toBe(true);
        expect(objects.has('viteval/datasets/index.json')).toBe(true);
        expect(
          await datasets.getItems({ datasetId: created.value.id })
        ).toMatchObject({
          ok: true,
          value: [{ input: 'original' }, { input: 'committed' }],
        });
      });
    }
  }
);

function googleBody(params: { body: Buffer; contentType: string }): Buffer {
  if (!params.contentType.startsWith('multipart/')) return params.body;
  const boundary = params.contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);
  if (!boundary) throw new Error('Missing upload boundary');
  const sections = params.body
    .toString('utf8')
    .split(`--${boundary[1] ?? boundary[2]}`);
  const part = sections[sections.length - 2];
  return Buffer.from(
    part.slice(part.indexOf('\r\n\r\n') + 4).replace(/\r\n$/, ''),
    'utf8'
  );
}
function googleMetadata(params: {
  key: string;
  object: StoredObject;
}): Record<string, unknown> {
  return {
    kind: 'storage#object',
    name: params.key,
    bucket: 'bucket',
    generation: params.object.version,
    size: String(params.object.body.length),
    contentType: 'application/json',
    crc32c: checksum(params.object.body),
    md5Hash: createHash('md5').update(params.object.body).digest('base64'),
  };
}
function checksum(body: Buffer): string {
  const checksum = new CRC32C();
  checksum.update(body);
  return checksum.toString();
}
