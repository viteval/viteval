import { createServer, type Server } from 'node:http';
import { LangfuseClient } from '@langfuse/client';
import { VoltOpsRestClient } from '@voltagent/sdk';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Provider } from '@viteval/core';
import { langfuse } from '#/langfuse/provider';
import { voltops } from '#/voltops/provider';
import { requireRecord } from '#/remote-record';
import { createLangfuseDatasets } from '#/langfuse/datasets';
import { createVoltOpsDatasets } from '#/voltops/datasets';

let server: Server;
let url: string;
let providers: Provider[];
let requests: {
  method: string;
  path: string;
  body: Record<string, unknown>;
  headers: Record<string, unknown>;
}[];
let observations: {
  name: string;
  sessionId: string;
  metadata: Record<string, unknown> | string;
}[];
let datasets: Map<string, Record<string, unknown>>;
let items: Map<string, Record<string, unknown>[]>;
let failure: string | undefined;
let ignoreObservationSession: boolean;
let itemFailureAfter: number | undefined;
let repeatedItems: boolean;
let prematureItems: boolean;
let repeatedObservations: boolean;
let invalidIdentifier: boolean;
let serializedObservationMetadata: boolean;
let ignoreObservationName: boolean;

beforeEach(async () => {
  providers = [];
  requests = [];
  observations = [];
  datasets = new Map();
  items = new Map();
  failure = undefined;
  ignoreObservationSession = false;
  itemFailureAfter = undefined;
  repeatedItems = false;
  prematureItems = false;
  repeatedObservations = false;
  invalidIdentifier = false;
  serializedObservationMetadata = false;
  ignoreObservationName = false;
  server = createServer(async (request, response) => {
    let text = '';
    for await (const chunk of request) text += String(chunk);
    const body = text ? requireRecord(JSON.parse(text)) : {};
    const parsed = new URL(request.url ?? '/', 'http://localhost');
    const pathname = parsed.pathname;
    const method = request.method ?? 'GET';
    requests.push({
      method,
      path: `${pathname}${parsed.search}`,
      body,
      headers: request.headers,
    });
    response.setHeader('Content-Type', 'application/json');
    if (failure && pathname.startsWith(failure)) {
      response.statusCode = 400;
      response.end(JSON.stringify({ message: 'fixture rejected request' }));
      return;
    }
    if (
      (method === 'POST' && pathname.endsWith('/items')) ||
      (method === 'POST' && pathname === '/api/public/dataset-items')
    ) {
      const uploaded = [...items.values()].reduce(
        (count, values) =>
          count + values.filter((value) => !isUploadControl(value)).length,
        0
      );
      if (
        !isUploadControl(body) &&
        itemFailureAfter !== undefined &&
        uploaded >= itemFailureAfter
      ) {
        response.statusCode = 400;
        response.end(
          JSON.stringify({ message: 'fixture item upload rejected' })
        );
        return;
      }
    }
    const now = '2026-10-09T00:00:00.000Z';
    let result: unknown;
    if (pathname === '/api/public/v2/datasets' && method === 'POST') {
      const dataset = {
        ...body,
        id: `lf-${datasets.size}`,
        createdAt: now,
        updatedAt: now,
      };
      datasets.set(dataset.id, dataset);
      items.set(dataset.id, []);
      result = dataset;
    } else if (pathname === '/api/public/v2/datasets')
      result = {
        data: [...datasets.values()],
        meta: { page: 1, limit: 100, totalItems: datasets.size, totalPages: 1 },
      };
    else if (pathname === '/api/public/dataset-items' && method === 'POST') {
      const dataset = [...datasets.values()].find(
        (dataset) => dataset.name === body.datasetName
      );
      const id = String(dataset?.id);
      const current = items.get(id) ?? [];
      const item = {
        ...body,
        id: typeof body.id === 'string' ? body.id : `item-${current.length}`,
        datasetId: id,
        status: body.status ?? 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      };
      items.set(id, [
        ...current.filter((existing) => existing.id !== item.id),
        item,
      ]);
      result = item;
    } else if (pathname === '/api/public/dataset-items') {
      const dataset = [...datasets.values()].find(
        (dataset) => dataset.name === parsed.searchParams.get('datasetName')
      );
      const records = items.get(String(dataset?.id)) ?? [];
      const page = Number(parsed.searchParams.get('page') ?? 1);
      result = {
        data: records.slice(page - 1, page),
        meta: {
          page,
          limit: 1,
          totalItems: records.length,
          totalPages: Math.max(1, records.length),
        },
      };
    } else if (pathname === '/api/public/otel/v1/traces') {
      for (const resource of array(body.resourceSpans))
        for (const scope of array(requireRecord(resource).scopeSpans))
          for (const value of array(requireRecord(scope).spans)) {
            const span = requireRecord(value);
            const attributes = Object.fromEntries(
              array(span.attributes).map((value) => {
                const attribute = requireRecord(value);
                return [
                  String(attribute.key),
                  requireRecord(attribute.value).stringValue,
                ];
              })
            );
            const metadata = Object.fromEntries(
              Object.entries(attributes)
                .filter(([key]) =>
                  key.startsWith('langfuse.observation.metadata.')
                )
                .map(([key, value]) => [
                  key.replace('langfuse.observation.metadata.', ''),
                  value,
                ])
            );
            observations.push({
              name: String(span.name),
              sessionId: String(attributes['langfuse.session.id']),
              metadata,
            });
          }
      result = {};
    } else if (pathname === '/api/public/scores') result = { id: body.id };
    else if (pathname === '/api/public/v2/observations') {
      const filters = parsed.searchParams.has('filter')
        ? array(JSON.parse(parsed.searchParams.get('filter')!)).map(
            requireRecord
          )
        : [];
      const matching = observations.filter(
        (observation) =>
          (!parsed.searchParams.get('name') ||
            observation.name === parsed.searchParams.get('name')) &&
          (ignoreObservationSession ||
            !parsed.searchParams.get('sessionId') ||
            observation.sessionId === parsed.searchParams.get('sessionId')) &&
          filters.every(
            (filter) =>
              (filter.column === 'name' && ignoreObservationName) ||
              (filter.column === 'sessionId' && ignoreObservationSession) ||
              (filter.type === 'string' &&
                filter.operator === '=' &&
                (filter.column === 'name'
                  ? observation.name
                  : observation.sessionId) === filter.value)
          )
      );
      const offset = Number(parsed.searchParams.get('cursor') ?? 0);
      result = {
        data: matching.slice(offset, offset + 1).map((observation) => ({
          ...observation,
          metadata: serializedObservationMetadata
            ? JSON.stringify(observation.metadata)
            : observation.metadata,
        })),
        meta: {
          cursor: repeatedObservations
            ? 'same'
            : offset + 1 < matching.length
              ? String(offset + 1)
              : null,
        },
      };
    } else if (pathname === '/evals/datasets' && method === 'POST') {
      const dataset = {
        ...body,
        id: `vo-${datasets.size}`,
        projectId: 'project',
        versions: [],
        versionCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      datasets.set(dataset.id, dataset);
      result = dataset;
    } else if (pathname === '/evals/datasets')
      result = [...datasets.values()].filter(
        (dataset) =>
          !parsed.searchParams.get('name') ||
          dataset.name === parsed.searchParams.get('name')
      );
    else if (/^\/evals\/datasets\/[^/]+$/.test(pathname))
      result = datasets.get(pathname.split('/')[3]) ?? null;
    else if (pathname.endsWith('/versions') && method === 'POST') {
      const id = pathname.split('/')[3];
      const dataset = requireRecord(datasets.get(id));
      const version = {
        id: `version-${array(dataset.versions).length}`,
        version: array(dataset.versions).length + 1,
        itemCount: 0,
        createdAt: now,
      };
      datasets.set(id, {
        ...dataset,
        versions: [version, ...array(dataset.versions)],
        versionCount: version.version,
      });
      items.set(`${id}/${version.id}`, []);
      result = version;
    } else if (
      pathname.endsWith('/items') &&
      pathname.startsWith('/evals/datasets/')
    ) {
      const parts = pathname.split('/');
      const key = `${parts[3]}/${parts[5]}`;
      const current = items.get(key) ?? [];
      if (method === 'POST') {
        const item = {
          ...body,
          id: `item-${current.length}`,
          datasetVersionId: parts[5],
          createdAt: now,
        };
        items.set(key, [...current, item]);
        const dataset = requireRecord(datasets.get(parts[3]));
        datasets.set(parts[3], {
          ...dataset,
          versions: array(dataset.versions).map((version) => ({
            ...requireRecord(version),
            ...(requireRecord(version).id === parts[5]
              ? { itemCount: current.length + 1 }
              : {}),
          })),
        });
        result = item;
      } else {
        const offset = Number(parsed.searchParams.get('offset') ?? 0);
        result = {
          items: prematureItems
            ? []
            : repeatedItems
              ? current.slice(0, 1)
              : current.slice(offset, offset + 1),
          total: current.length,
        };
      }
    } else if (pathname === '/evals/experiments')
      result = { ...body, id: 'experiment', createdAt: now, updatedAt: now };
    else if (pathname === '/evals/scorers')
      result = { ...body, createdAt: now, updatedAt: now };
    else if (pathname.startsWith('/evals/runs'))
      result = {
        id: 'run',
        status: pathname.endsWith('/complete') ? body.status : 'running',
        createdAt: now,
        updatedAt: now,
      };
    else {
      response.statusCode = 404;
      result = { message: `Unexpected fixture endpoint: ${pathname}` };
    }
    response.end(
      JSON.stringify(
        invalidIdentifier && pathname.endsWith('/versions') ? {} : result
      )
    );
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('Missing fixture server address');
  url = `http://127.0.0.1:${address.port}`;
});
afterEach(async () => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  for (const provider of providers) await provider.close();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve()))
  );
});

describe.each(['langfuse', 'voltops'] as const)(
  '%s hosted SDK contract',
  (name) => {
    async function initialized() {
      const options = {
        publicKey: 'fixture-public',
        secretKey: 'fixture-secret',
        baseUrl: url,
      };
      const provider =
        name === 'langfuse' ? langfuse(options) : voltops(options);
      providers.push(provider);
      const result = await provider.initialize();
      if (!result.ok) throw result.error;
      return provider;
    }
    it('should create hosted datasets and read every item page', async () => {
      const provider = await initialized();
      const created = await provider.datasets!.create({
        name: 'questions',
        items: [
          { input: 'first', expected: 'FIRST', extra: { category: 'one' } },
          { input: 'second', expected: 'SECOND' },
        ],
      });
      if (!created.ok) throw created.error;
      expect(created.value.itemCount).toBe(2);
      expect(
        await provider.datasets!.getItems({ datasetId: created.value.id })
      ).toMatchObject({
        ok: true,
        value: [
          { input: 'first', ordinal: 0 },
          { input: 'second', ordinal: 1 },
        ],
      });
      expect(
        await provider.datasets!.getItems({
          datasetId: created.value.id,
          offset: 1,
          limit: 1,
        })
      ).toMatchObject({ ok: true, value: [{ input: 'second', ordinal: 1 }] });
      expect(await provider.datasets!.get({ name: 'questions' })).toMatchObject(
        { ok: true, value: { id: created.value.id } }
      );
      expect(
        await provider.datasets!.replaceItems!({
          datasetId: created.value.id,
          items: [],
        })
      ).toMatchObject({ ok: false });
    });
    it('should upload final results and preserve summary configuration', async () => {
      const provider = await initialized();
      const created = await provider.evals!.create({
        name: 'accuracy',
        config: { aggregation: 'sum', threshold: 1, scorerNames: ['exact'] },
      });
      if (!created.ok) throw created.error;
      const params = {
        evalRunId: created.value.id,
        input: 'first',
        expected: 'FIRST',
        output: 'FIRST',
        scores: [{ name: 'exact', score: 1 }],
        meanScore: 1,
        medianScore: 1,
        sumScore: 1,
        passed: true,
      };
      expect(await provider.evals!.addResult(params)).toMatchObject({
        ok: true,
      });
      expect(
        await provider.evals!.complete({
          id: created.value.id,
          summary: {
            meanScore: 1,
            medianScore: 1,
            sumScore: 1,
            passedCount: 1,
            failedCount: 0,
            totalCount: 1,
            passed: true,
          },
        })
      ).toMatchObject({
        ok: true,
        value: { config: { aggregation: 'sum' }, status: 'completed' },
      });
      expect(
        await provider.evals!.get({
          id: created.value.id,
          includeResults: true,
        })
      ).toMatchObject({
        ok: true,
        value: { results: [{ output: 'FIRST', passed: true }] },
      });
      expect(await provider.evals!.addResult(params)).toMatchObject({
        ok: false,
      });
      if (name === 'langfuse') {
        const otlp = requests.find(
          (request) => request.path === '/api/public/otel/v1/traces'
        );
        expect(otlp?.headers['x-langfuse-ingestion-version']).toBe('4');
        expect(otlp?.headers.authorization).toBe(
          `Basic ${Buffer.from('fixture-public:fixture-secret').toString('base64')}`
        );
        expect(
          requests.some((request) => request.path === '/api/public/scores')
        ).toBe(true);
      } else {
        expect(
          requests.find((request) => request.path === '/evals/runs')?.body
        ).toMatchObject({ autoQueue: false, experimentId: 'experiment' });
        expect(
          requests.find((request) => request.path === '/evals/runs/run/results')
            ?.body
        ).toMatchObject({
          results: [
            {
              threshold: 1,
              thresholdPassed: true,
              status: 'passed',
              scores: [{ score: 1 }],
            },
          ],
        });
        expect(
          requests.find(
            (request) => request.path === '/evals/runs/run/complete'
          )?.body
        ).toMatchObject({
          status: 'succeeded',
          summary: { meanScore: 1, medianScore: 1, sumScore: 1 },
        });
      }
    });
    it('should reject unsupported values before sending writes', async () => {
      const provider = await initialized();
      expect(
        await provider.datasets!.create({
          name: 'invalid',
          items: [{ input: 1n, expected: 'a' }],
        })
      ).toMatchObject({ ok: false });
      expect(requests).toHaveLength(0);
    });
    it('should return SDK API failures through Result values', async () => {
      const provider = await initialized();
      failure =
        name === 'langfuse' ? '/api/public/v2/datasets' : '/evals/datasets';
      expect(
        await provider.datasets!.create({ name: 'rejected' })
      ).toMatchObject({ ok: false });
    });
    it('should paginate listings, append items, and report unsupported mutations', async () => {
      const provider = await initialized();
      const first = await provider.datasets!.create({ name: 'first' });
      if (!first.ok) throw first.error;
      expect(
        await provider.datasets!.addItems({
          datasetId: first.value.id,
          items: [{ input: 'q', expected: 'a', extra: { name: 'label' } }],
        })
      ).toMatchObject({ ok: true });
      expect(await provider.datasets!.list()).toMatchObject({
        ok: true,
        value: [{ name: 'first' }],
      });
      expect(
        await provider.datasets!.list({ offset: 0, limit: 1 })
      ).toMatchObject({ ok: true, value: [{ name: 'first' }] });
      expect(await provider.datasets!.list({ limit: 1 })).toMatchObject({
        ok: true,
        value: [{ name: 'first' }],
      });
      expect(
        await provider.datasets!.getItems({
          datasetId: first.value.id,
          limit: 1,
        })
      ).toMatchObject({ ok: true, value: [{ input: 'q' }] });
      expect(
        await provider.datasets!.list({ offset: 1, limit: 1 })
      ).toMatchObject({ ok: true, value: [] });
      expect(await provider.datasets!.get({ name: 'missing' })).toMatchObject({
        ok: true,
        value: null,
      });
      expect(
        await provider.datasets!.getItems({
          datasetId: first.value.id,
          limit: 0,
        })
      ).toMatchObject({ ok: true, value: [] });
      expect(
        await provider.datasets!.getItems({ datasetId: 'missing' })
      ).toMatchObject({ ok: false });
      expect(
        await provider.datasets!.addItems({ datasetId: 'missing', items: [] })
      ).toMatchObject({ ok: false });
      expect(
        await provider.datasets!.update({ id: first.value.id, name: 'rename' })
      ).toMatchObject({ ok: false });
      expect(
        await provider.datasets!.delete({ id: first.value.id })
      ).toMatchObject({ ok: false });
      expect(await provider.datasets!.create({ name: ' ' })).toMatchObject({
        ok: false,
      });
    });
    it('should surface partially uploaded datasets with recovery guidance', async () => {
      const provider = await initialized();
      itemFailureAfter = 1;
      const created = await provider.datasets!.create({
        name: 'partial',
        items: [
          { input: 'first', expected: 'a' },
          { input: 'second', expected: 'b' },
        ],
      });
      expect(created).toMatchObject({ ok: false });
      if (created.ok) throw new Error('Expected failed upload');
      expect(created.error.message).toContain('may be incomplete');
      expect(created.error.message).toMatch(/Inspect/);
      expect(created.error.cause).toBeInstanceOf(Error);
      expect(
        [...items.values()].flat().filter((item) => !isUploadControl(item))
      ).toHaveLength(1);
      itemFailureAfter = undefined;
      expect(await provider.datasets!.get({ name: 'partial' })).toMatchObject({
        ok: false,
        error: {
          message: expect.stringContaining('incomplete Viteval upload'),
        },
      });
    });
    it('should reject partial uploads through fresh instances, retries, and every read path', async () => {
      const writer = await initialized();
      itemFailureAfter = 1;
      expect(
        await writer.datasets!.create({
          name: 'interrupted',
          items: [
            { input: 'persisted', expected: 'a' },
            { input: 'missing', expected: 'b' },
          ],
        })
      ).toMatchObject({ ok: false });
      const remote = [...datasets.values()].find(
        (dataset) => dataset.name === 'interrupted'
      );
      if (!remote || typeof remote.id !== 'string')
        throw new Error('Expected partially persisted remote dataset');
      const id = remote.id;
      await writer.close();
      itemFailureAfter = undefined;
      const reader = await initialized();
      const operations = [
        () => reader.datasets!.get({ name: 'interrupted' }),
        () => reader.datasets!.get({ id }),
        () => reader.datasets!.list(),
        () => reader.datasets!.getItems({ datasetId: id }),
        () => reader.datasets!.getItems({ datasetId: id, limit: 0 }),
        () => reader.datasets!.addItems({ datasetId: id, items: [] }),
        () => reader.datasets!.create({ name: 'interrupted', items: [] }),
      ];
      for (const operation of operations) {
        expect(await operation()).toMatchObject({
          ok: false,
          error: {
            message: expect.stringContaining('incomplete Viteval upload'),
          },
        });
      }
      expect(
        [...datasets.values()].filter(
          (dataset) => dataset.name === 'interrupted'
        )
      ).toHaveLength(1);
    });
    it.each([{ cases: [] }, { cases: [{ input: 'q', expected: 'a' }] }])(
      'should expose only completed user cases across fresh provider instances',
      async ({ cases }) => {
        const writer = await initialized();
        const created = await writer.datasets!.create({
          name: 'complete',
          description: 'User description',
          metadata: { owner: 'team' },
          items: cases,
        });
        if (!created.ok) throw created.error;
        expect(created.value).toMatchObject({
          itemCount: cases.length,
          description: 'User description',
        });
        await writer.close();
        const reader = await initialized();
        expect(await reader.datasets!.get({ name: 'complete' })).toMatchObject({
          ok: true,
          value: { itemCount: cases.length, description: 'User description' },
        });
        const loaded = await reader.datasets!.getItems({
          datasetId: created.value.id,
        });
        if (!loaded.ok) throw loaded.error;
        expect(
          loaded.value.map(({ input, expected }) => ({ input, expected }))
        ).toEqual(cases);
        expect(
          await reader.datasets!.create({ name: 'complete' })
        ).toMatchObject({
          ok: false,
          error: { message: expect.stringContaining('already exists') },
        });
      }
    );
    it('should reject reserved item metadata before creating a dataset', async () => {
      const provider = await initialized();
      expect(
        await provider.datasets!.create({
          name: 'reserved',
          items: [
            { input: 'q', expected: 'a', extra: { __viteval_upload: {} } },
          ],
        })
      ).toMatchObject({
        ok: false,
        error: { message: expect.stringContaining('reserved by Viteval') },
      });
      expect(datasets.size).toBe(0);
    });
    it.each([
      'schema',
      'identity',
      'state',
      'missing',
      'commit-schema',
      'commit-state',
      'identity-type',
      'empty-identity',
    ] as const)(
      'should reject malformed persisted %s control records',
      async (mode) => {
        const provider = await initialized();
        const created = await provider.datasets!.create({ name: 'control' });
        if (!created.ok) throw created.error;
        const key =
          name === 'langfuse'
            ? created.value.id
            : `${created.value.id}/version-0`;
        const records = items.get(key)!;
        const target = mode.startsWith('commit') ? records.length - 1 : 0;
        if (mode === 'missing') {
          items.set(key, []);
        } else {
          items.set(
            key,
            records.map((item, index) => {
              if (index !== target && mode !== 'empty-identity') return item;
              const field = name === 'langfuse' ? 'metadata' : 'extra';
              const marker = requireRecord(
                requireRecord(item[field]).__viteval_upload
              );
              const patch = mode.includes('schema')
                ? { schemaVersion: 2 }
                : mode.includes('state')
                  ? { state: 'invalid' }
                  : mode === 'identity-type'
                    ? { id: 42 }
                    : { id: mode === 'empty-identity' ? '' : 'wrong' };
              return {
                ...item,
                [field]: { __viteval_upload: { ...marker, ...patch } },
              };
            })
          );
        }
        expect(
          await provider.datasets!.getItems({
            datasetId: created.value.id,
            limit: 0,
          })
        ).toMatchObject({ ok: false });
      }
    );
    it('should initialize idempotently and clear operations on close', async () => {
      const provider = await initialized();
      expect(await provider.initialize()).toMatchObject({ ok: true });
      expect(await provider.close()).toMatchObject({ ok: true });
      expect(provider.datasets).toBeUndefined();
      expect(provider.evals).toBeUndefined();
      expect(await provider.close()).toMatchObject({ ok: true });
    });
  }
);

describe('Langfuse remote history', () => {
  it.each([42, 'missing-control'])(
    'should reject invalid initial upload identity %s',
    async (initial) => {
      const provider = langfuse({
        publicKey: 'fixture',
        secretKey: 'fixture',
        baseUrl: url,
      });
      providers.push(provider);
      await provider.initialize();
      const created = await provider.datasets!.create({ name: 'protected' });
      if (!created.ok) throw created.error;
      datasets.set(created.value.id, {
        ...requireRecord(datasets.get(created.value.id)),
        metadata: { __viteval_initial_upload: initial },
      });
      expect(
        await provider.datasets!.get({ id: created.value.id })
      ).toMatchObject({ ok: false });
    }
  );
  it('should reject reserved dataset metadata without creating a dataset', async () => {
    const provider = langfuse({
      publicKey: 'fixture',
      secretKey: 'fixture',
      baseUrl: url,
    });
    providers.push(provider);
    await provider.initialize();
    expect(
      await provider.datasets!.create({
        name: 'reserved',
        metadata: { __viteval_initial_upload: 'forged' },
      })
    ).toMatchObject({ ok: false });
    expect(datasets.size).toBe(0);
  });
  it('should reject active control rows and accept unmanaged records with omitted metadata', async () => {
    const provider = langfuse({
      publicKey: 'fixture',
      secretKey: 'fixture',
      baseUrl: url,
    });
    providers.push(provider);
    await provider.initialize();
    const now = '2026-10-26T00:00:00.000Z';
    datasets.set('external', {
      id: 'external',
      name: 'external',
      createdAt: now,
      updatedAt: now,
    });
    items.set('external', [
      {
        id: 'row',
        input: 'external case',
        expectedOutput: 'answer',
        status: 'ACTIVE',
      },
    ]);
    expect(await provider.datasets!.get({ id: 'external' })).toMatchObject({
      ok: true,
      value: { itemCount: 1, metadata: {} },
    });
    const created = await provider.datasets!.create({ name: 'protected' });
    if (!created.ok) throw created.error;
    items.set(
      created.value.id,
      items
        .get(created.value.id)!
        .map((item) => ({ ...item, status: 'ACTIVE' }))
    );
    expect(
      await provider.datasets!.get({ id: created.value.id })
    ).toMatchObject({ ok: false });
  });
  it('should preserve non-Error upload failures with incomplete dataset guidance', async () => {
    const client = new LangfuseClient({
      publicKey: 'fixture',
      secretKey: 'fixture',
      baseUrl: url,
    });
    vi.spyOn(client.api.datasetItems, 'create').mockRejectedValue(
      'non-error upload failure'
    );
    expect(
      await createLangfuseDatasets(client).create({
        name: 'partial',
        items: [{ input: 'q', expected: 'a' }],
      })
    ).toMatchObject({
      ok: false,
      error: {
        message: expect.stringContaining('non-error upload failure'),
        cause: 'non-error upload failure',
      },
    });
  });
  it('should resume a running remote snapshot without a local run cache', async () => {
    const provider = langfuse({
      publicKey: 'fixture',
      secretKey: 'fixture',
      baseUrl: url,
    });
    providers.push(provider);
    await provider.initialize();
    observations.push({
      name: 'viteval.run',
      sessionId: 'remote-running',
      metadata: {
        viteval_run: JSON.stringify({
          id: 'remote-running',
          name: 'resumed',
          status: 'running',
          config: { aggregation: 'mean', threshold: 1, scorerNames: [] },
          metadata: {},
          startedAt: '2026-10-01T00:00:00.000Z',
        }),
      },
    });
    expect(
      await provider.evals!.addResult({
        evalRunId: 'remote-running',
        input: 'q',
        expected: 'a',
        output: 'a',
        scores: [],
        meanScore: 1,
        medianScore: 1,
        sumScore: 1,
        passed: true,
      })
    ).toMatchObject({ ok: true });
    expect(
      await provider.evals!.get({ id: 'remote-running', includeResults: true })
    ).toMatchObject({ ok: true, value: { results: [{ output: 'a' }] } });
  });
  it('should reject repeated observation cursors instead of hanging', async () => {
    const provider = langfuse({
      publicKey: 'fixture',
      secretKey: 'fixture',
      baseUrl: url,
    });
    providers.push(provider);
    await provider.initialize();
    repeatedObservations = true;
    expect(await provider.evals!.list()).toMatchObject({
      ok: false,
      error: { message: 'Langfuse returned a repeated observations cursor' },
    });
  });
  it('should filter and paginate local runs and persist explicit case identity and failures', async () => {
    const provider = langfuse({
      publicKey: 'fixture',
      secretKey: 'fixture',
      baseUrl: url,
      timeout: 1,
    });
    providers.push(provider);
    await provider.initialize();
    const created = await provider.evals!.create({
      name: 'failure',
      datasetId: 'dataset',
      metadata: { source: 'test' },
      config: { aggregation: 'median', threshold: 1, scorerNames: [] },
    });
    if (!created.ok) throw created.error;
    const params = {
      evalRunId: created.value.id,
      input: 'q',
      expected: 'a',
      output: 'wrong',
      duration: 10,
      metadata: {
        name: 'named case',
        datasetItemId: 'item',
        executionError: 'task error',
      },
      scores: [],
      meanScore: 0,
      medianScore: 0,
      sumScore: 0,
      passed: false,
    };
    expect(await provider.evals!.addResult(params)).toMatchObject({ ok: true });
    expect(
      await provider.evals!.addResult({ ...params, metadata: {} })
    ).toMatchObject({ ok: true });
    expect(await provider.evals!.get({ id: created.value.id })).toMatchObject({
      ok: true,
      value: { results: undefined },
    });
    await provider.evals!.create({
      name: 'other',
      config: created.value.config,
    });
    expect(await provider.evals!.list()).toMatchObject({
      ok: true,
      value: [expect.anything(), expect.anything()],
    });
    expect(await provider.evals!.list({ limit: 1 })).toMatchObject({
      ok: true,
      value: [expect.anything()],
    });
    expect(
      await provider.evals!.addResult({
        ...params,
        scores: [{ name: 'invalid', score: Infinity }],
      })
    ).toMatchObject({ ok: false });
    expect(
      await provider.evals!.list({
        datasetId: 'dataset',
        status: 'running',
        offset: 0,
        limit: 1,
      })
    ).toMatchObject({ ok: true, value: [{ id: created.value.id }] });
    expect(await provider.evals!.list({ status: 'completed' })).toMatchObject({
      ok: true,
      value: [],
    });
    expect(
      await provider.evals!.complete({
        id: 'missing',
        summary: {
          meanScore: 0,
          medianScore: 0,
          sumScore: 0,
          passedCount: 0,
          failedCount: 0,
          totalCount: 0,
          passed: true,
        },
      })
    ).toMatchObject({ ok: false });
  });
  it('should use the environment host for both SDK requests and experiment export', async () => {
    vi.stubEnv('LANGFUSE_BASE_URL', `${url}/`);
    const provider = langfuse({
      publicKey: 'fixture-public',
      secretKey: 'fixture-secret',
    });
    providers.push(provider);
    const initialized = await provider.initialize();
    if (!initialized.ok) throw initialized.error;
    const run = await provider.evals!.create({
      name: 'env-host',
      config: { aggregation: 'mean', threshold: 1, scorerNames: ['exact'] },
    });
    if (!run.ok) throw run.error;
    expect(
      await provider.evals!.addResult({
        evalRunId: run.value.id,
        input: 'q',
        expected: 'a',
        output: 'a',
        scores: [{ name: 'exact', score: 1 }],
        meanScore: 1,
        medianScore: 1,
        sumScore: 1,
        passed: true,
      })
    ).toMatchObject({ ok: true });
    expect(
      requests.some((request) => request.path === '/api/public/scores')
    ).toBe(true);
    expect(
      requests.some((request) => request.path === '/api/public/otel/v1/traces')
    ).toBe(true);
  });

  it('should keep remote run and result IDs isolated when the service ignores session filtering', async () => {
    const options = {
      publicKey: 'fixture-public',
      secretKey: 'fixture-secret',
      baseUrl: url,
    };
    const writer = langfuse(options);
    providers.push(writer);
    const initialized = await writer.initialize();
    if (!initialized.ok) throw initialized.error;
    const ids: string[] = [];
    for (const name of ['first', 'second']) {
      const created = await writer.evals!.create({
        name,
        config: { aggregation: 'mean', threshold: 1, scorerNames: ['exact'] },
      });
      if (!created.ok) throw created.error;
      ids.push(created.value.id);
      const added = await writer.evals!.addResult({
        evalRunId: created.value.id,
        input: name,
        expected: name,
        output: name,
        scores: [{ name: 'exact', score: 1 }],
        meanScore: 1,
        medianScore: 1,
        sumScore: 1,
        passed: true,
      });
      if (!added.ok) throw added.error;
      const completed = await writer.evals!.complete({
        id: created.value.id,
        summary: {
          meanScore: 1,
          medianScore: 1,
          sumScore: 1,
          passedCount: 1,
          failedCount: 0,
          totalCount: 1,
          passed: true,
        },
      });
      if (!completed.ok) throw completed.error;
    }
    ignoreObservationSession = true;
    const reader = langfuse(options);
    providers.push(reader);
    const readerInitialized = await reader.initialize();
    if (!readerInitialized.ok) throw readerInitialized.error;
    expect(
      await reader.evals!.get({ id: 'missing', includeResults: true })
    ).toMatchObject({ ok: true, value: null });
    for (const [index, id] of ids.entries()) {
      const loaded = await reader.evals!.get({ id, includeResults: true });
      if (!loaded.ok) throw loaded.error;
      expect(loaded.value?.id).toBe(id);
      expect(loaded.value?.results).toHaveLength(1);
      expect(loaded.value?.results?.[0].evalRunId).toBe(id);
      expect(loaded.value?.results?.[0].input).toBe(
        index === 0 ? 'first' : 'second'
      );
    }
    const query = requests.find((request) =>
      request.path.startsWith('/api/public/v2/observations?')
    );
    expect(
      JSON.parse(new URL(query!.path, url).searchParams.get('filter')!)
    ).toEqual(
      expect.arrayContaining([
        {
          type: 'string',
          column: 'sessionId',
          operator: '=',
          value: 'missing',
        },
      ])
    );
  });
  it('should exclude archived dataset items from both reads and item counts', async () => {
    const provider = langfuse({
      publicKey: 'fixture-public',
      secretKey: 'fixture-secret',
      baseUrl: url,
    });
    providers.push(provider);
    await provider.initialize();
    const created = await provider.datasets!.create({
      name: 'active-only',
      items: [
        { input: 'archived', expected: 'a' },
        { input: 'active', expected: 'a' },
      ],
    });
    if (!created.ok) throw created.error;
    const records = items.get(created.value.id)!;
    items.set(
      created.value.id,
      records.map((record) =>
        record.input === 'archived'
          ? { ...record, status: 'ARCHIVED' }
          : record.input === 'active'
            ? { ...record, metadata: null }
            : record
      )
    );
    datasets.set(created.value.id, {
      ...requireRecord(datasets.get(created.value.id)),
      metadata: null,
    });
    expect(
      await provider.datasets!.get({ id: created.value.id })
    ).toMatchObject({ ok: true, value: { itemCount: 1 } });
    expect(
      await provider.datasets!.getItems({ datasetId: created.value.id })
    ).toMatchObject({ ok: true, value: [{ input: 'active', ordinal: 0 }] });
  });
  it('should recover completed runs and paginated results in a fresh provider', async () => {
    const options = {
      publicKey: 'fixture-public',
      secretKey: 'fixture-secret',
      baseUrl: url,
    };
    const provider = langfuse(options);
    providers.push(provider);
    await provider.initialize();
    const created = await provider.evals!.create({
      name: 'history',
      config: { aggregation: 'mean', threshold: 1, scorerNames: ['exact'] },
    });
    if (!created.ok) throw created.error;
    const params = {
      evalRunId: created.value.id,
      input: 'q',
      expected: 'a',
      output: 'a',
      scores: [{ name: 'exact', score: 1 }],
      meanScore: 1,
      medianScore: 1,
      sumScore: 1,
      passed: true,
    };
    await Promise.all([
      provider.evals!.addResult(params),
      provider.evals!.addResult({ ...params, input: 'second' }),
    ]);
    expect(
      await provider.evals!.get({ id: created.value.id, includeResults: true })
    ).toMatchObject({
      ok: true,
      value: { results: [expect.anything(), expect.anything()] },
    });
    await provider.evals!.complete({
      id: created.value.id,
      summary: {
        meanScore: 1,
        medianScore: 1,
        sumScore: 2,
        passedCount: 2,
        failedCount: 0,
        totalCount: 2,
        passed: true,
      },
    });
    const fresh = langfuse(options);
    providers.push(fresh);
    await fresh.initialize();
    serializedObservationMetadata = true;
    ignoreObservationName = true;
    expect(
      await fresh.evals!.get({ id: created.value.id, includeResults: true })
    ).toMatchObject({
      ok: true,
      value: {
        status: 'completed',
        results: [expect.anything(), expect.anything()],
      },
    });
    ignoreObservationName = false;
    expect(await fresh.evals!.list({ status: 'completed' })).toMatchObject({
      ok: true,
      value: [{ id: created.value.id, config: { threshold: 1 } }],
    });
    serializedObservationMetadata = false;
    expect(await fresh.evals!.list()).toMatchObject({
      ok: true,
      value: [{ id: created.value.id }],
    });
    expect(await fresh.evals!.get({ id: 'missing' })).toMatchObject({
      ok: true,
      value: null,
    });
  });
  it('should fail explicitly when the OTLP exporter cannot persist a result', async () => {
    const provider = langfuse({
      publicKey: 'fixture-public',
      secretKey: 'fixture-secret',
      baseUrl: url,
    });
    providers.push(provider);
    await provider.initialize();
    const created = await provider.evals!.create({
      name: 'blocked',
      config: { aggregation: 'mean', threshold: 1, scorerNames: [] },
    });
    if (!created.ok) throw created.error;
    failure = '/api/public/otel/v1/traces';
    expect(
      await provider.evals!.addResult({
        evalRunId: created.value.id,
        input: 'q',
        expected: 'a',
        output: 'a',
        scores: [],
        meanScore: 1,
        medianScore: 1,
        sumScore: 1,
        passed: true,
      })
    ).toMatchObject({ ok: false });
    expect(
      await provider.evals!.get({ id: created.value.id, includeResults: true })
    ).toMatchObject({ ok: true, value: { results: [] } });
  });
});

describe('VoltOps hosted runs', () => {
  it('should preserve unmanaged reads but reject unsafe appends', async () => {
    const provider = voltops({
      publicKey: 'fixture',
      secretKey: 'fixture',
      baseUrl: url,
    });
    providers.push(provider);
    await provider.initialize();
    const now = '2026-10-26T00:00:00.000Z';
    datasets.set('external', {
      id: 'external',
      name: 'external',
      createdAt: now,
      updatedAt: now,
      versions: [],
      versionCount: 0,
      projectId: 'project',
    });
    expect(await provider.datasets!.get({ id: 'external' })).toMatchObject({
      ok: true,
      value: { itemCount: 0, version: 1 },
    });
    expect(
      await provider.datasets!.getItems({ datasetId: 'external' })
    ).toMatchObject({ ok: true, value: [] });
    expect(
      await provider.datasets!.addItems({ datasetId: 'external', items: [] })
    ).toMatchObject({
      ok: false,
      error: { message: expect.stringContaining('unmanaged dataset') },
    });
    datasets.set('external', {
      ...requireRecord(datasets.get('external')),
      versions: [
        { id: 'external-version', version: 1, itemCount: 0, createdAt: now },
      ],
    });
    items.set('external/external-version', []);
    expect(await provider.datasets!.get({ id: 'external' })).toMatchObject({
      ok: true,
      value: { itemCount: 0 },
    });
  });
  it('should reject invalid managed descriptions even when upload controls are complete', async () => {
    const provider = voltops({
      publicKey: 'fixture',
      secretKey: 'fixture',
      baseUrl: url,
    });
    providers.push(provider);
    await provider.initialize();
    const created = await provider.datasets!.create({ name: 'description' });
    if (!created.ok) throw created.error;
    datasets.set(created.value.id, {
      ...requireRecord(datasets.get(created.value.id)),
      description: 'viteval:dataset-upload:v1\n{"description":42}',
    });
    expect(
      await provider.datasets!.get({ id: created.value.id })
    ).toMatchObject({
      ok: false,
      error: { message: 'Invalid Viteval dataset description' },
    });
  });
  it('should preserve non-Error version upload failures with recovery guidance', async () => {
    const client = new VoltOpsRestClient({
      publicKey: 'fixture',
      secretKey: 'fixture',
      baseUrl: url,
    });
    const sendRequest = client.httpClient.sendRequest.bind(client.httpClient);
    vi.spyOn(client.httpClient, 'sendRequest').mockImplementation(
      async (path, options) => {
        if (path.endsWith('/items')) throw 'non-error upload failure';
        return sendRequest(path, options);
      }
    );
    expect(
      await createVoltOpsDatasets(client).create({
        name: 'partial',
        items: [{ input: 'q', expected: 'a' }],
      })
    ).toMatchObject({
      ok: false,
      error: {
        message: expect.stringContaining('non-error upload failure'),
        cause: 'non-error upload failure',
      },
    });
  });
  it('should identify orphaned datasets when version creation fails', async () => {
    const provider = voltops({
      publicKey: 'fixture',
      secretKey: 'fixture',
      baseUrl: url,
    });
    providers.push(provider);
    await provider.initialize();
    invalidIdentifier = true;
    expect(
      await provider.datasets!.create({ name: 'invalid-version' })
    ).toMatchObject({
      ok: false,
      error: {
        message: expect.stringContaining('version (unknown) may be incomplete'),
      },
    });
    expect(
      await provider.datasets!.get({ name: 'invalid-version' })
    ).toMatchObject({
      ok: false,
      error: { message: expect.stringContaining('incomplete Viteval upload') },
    });
  });
  it('should bind existing hosted experiments and dataset versions and validate result batches', async () => {
    const provider = voltops({
      publicKey: 'fixture',
      secretKey: 'fixture',
      baseUrl: url,
      datasetId: 'vo-0',
      experimentId: 'existing',
      triggerSource: 'ci',
    });
    providers.push(provider);
    await provider.initialize();
    const dataset = await provider.datasets!.create({
      name: 'bound',
      items: [{ input: 'q', expected: null }],
    });
    if (!dataset.ok) throw dataset.error;
    const run = await provider.evals!.create({
      name: 'bound',
      config: { aggregation: 'sum', threshold: 1, scorerNames: ['exact'] },
    });
    if (!run.ok) throw run.error;
    expect(run.value.datasetId).toBe(dataset.value.id);
    expect(
      requests.some((request) => request.path === '/evals/experiments')
    ).toBe(false);
    const params = {
      evalRunId: run.value.id,
      input: 'q',
      expected: null,
      output: 'wrong',
      scores: [{ name: 'exact', score: 0 }],
      meanScore: 0,
      medianScore: 0,
      sumScore: 0,
      passed: false,
      metadata: { name: 'case', datasetItemId: 'item' },
    };
    expect(await provider.evals!.addResults!([])).toMatchObject({
      ok: true,
      value: [],
    });
    expect(
      await provider.evals!.addResults!([
        params,
        { ...params, evalRunId: 'other' },
      ])
    ).toMatchObject({ ok: false });
    expect(
      await provider.evals!.addResult({
        ...params,
        scores: [{ name: 'unknown', score: 0 }],
      })
    ).toMatchObject({
      ok: false,
      error: { message: expect.stringContaining('Scorer was not registered') },
    });
    expect(await provider.evals!.addResult(params)).toMatchObject({ ok: true });
    expect(
      requests.find((request) => request.path.endsWith('/results'))?.body
    ).toMatchObject({
      results: [
        {
          status: 'failed',
          datasetItemId: 'item',
          datasetItemLabel: 'case',
          datasetVersionId: 'version-0',
        },
      ],
    });
    const summary = {
      meanScore: 0,
      medianScore: 0,
      sumScore: 0,
      passedCount: 0,
      failedCount: 0,
      totalCount: 0,
      passed: false,
    };
    expect(
      await provider.evals!.complete({ id: run.value.id, summary })
    ).toMatchObject({ ok: true });
    expect(
      await provider.evals!.complete({ id: run.value.id, summary })
    ).toMatchObject({
      ok: false,
      error: { message: expect.stringContaining('already finalized') },
    });
    expect(await provider.evals!.addResult(params)).toMatchObject({
      ok: false,
    });
    const current = requireRecord(datasets.get(dataset.value.id));
    datasets.set(dataset.value.id, { ...current, versions: [] });
    expect(
      await provider.datasets!.get({ id: dataset.value.id })
    ).toMatchObject({
      ok: false,
      error: { message: expect.stringContaining('incomplete Viteval upload') },
    });
    expect(
      await provider.datasets!.getItems({ datasetId: dataset.value.id })
    ).toMatchObject({
      ok: false,
      error: { message: expect.stringContaining('incomplete Viteval upload') },
    });
    expect(
      await provider.evals!.create({
        name: 'no-version',
        config: run.value.config,
      })
    ).toMatchObject({
      ok: false,
      error: { message: expect.stringContaining('has no version') },
    });
  });
  it.each(['repeated', 'premature'] as const)(
    'should reject %s item pagination',
    async (mode) => {
      const provider = voltops({
        publicKey: 'fixture',
        secretKey: 'fixture',
        baseUrl: url,
      });
      providers.push(provider);
      await provider.initialize();
      const created = await provider.datasets!.create({
        name: 'pagination',
        items: [
          { input: 1, expected: 1 },
          { input: 2, expected: 2 },
        ],
      });
      if (!created.ok) throw created.error;
      repeatedItems = mode === 'repeated';
      prematureItems = mode === 'premature';
      expect(
        await provider.datasets!.getItems({ datasetId: created.value.id })
      ).toMatchObject({
        ok: false,
        error: {
          message:
            mode === 'repeated'
              ? 'VoltOps returned a repeated dataset page'
              : 'VoltOps dataset pagination ended before all items were returned',
        },
      });
    }
  );
  it('should hash equivalent dataset items consistently while retaining unique result IDs', async () => {
    const provider = voltops({
      publicKey: 'fixture-public',
      secretKey: 'fixture-secret',
      baseUrl: url,
    });
    providers.push(provider);
    const initialized = await provider.initialize();
    if (!initialized.ok) throw initialized.error;
    const run = await provider.evals!.create({
      name: 'stable-items',
      config: { aggregation: 'mean', threshold: 1, scorerNames: ['exact'] },
    });
    if (!run.ok) throw run.error;
    const params = {
      evalRunId: run.value.id,
      input: 'q',
      expected: 'a',
      output: 'a',
      scores: [{ name: 'exact', score: 1 }],
      meanScore: 1,
      medianScore: 1,
      sumScore: 1,
      passed: true,
    };
    expect(await provider.evals!.addResults!([params, params])).toMatchObject({
      ok: true,
    });
    const payload = requests.find(
      (request) => request.path === '/evals/runs/run/results'
    );
    const records = array(payload?.body.results).map(requireRecord);
    expect(records).toHaveLength(2);
    expect(records[0].id).not.toBe(records[1].id);
    expect(records[0].datasetItemHash).toBe(records[1].datasetItemHash);
  });

  it('should identify the incomplete dataset version after a rejected append upload', async () => {
    const provider = voltops({
      publicKey: 'fixture-public',
      secretKey: 'fixture-secret',
      baseUrl: url,
    });
    providers.push(provider);
    const initialized = await provider.initialize();
    if (!initialized.ok) throw initialized.error;
    const created = await provider.datasets!.create({
      name: 'partial-version',
      items: [{ input: 'original', expected: 'a' }],
    });
    if (!created.ok) throw created.error;
    failure = `/evals/datasets/${created.value.id}/versions/version-1/items`;
    const appended = await provider.datasets!.addItems({
      datasetId: created.value.id,
      items: [{ input: 'new', expected: 'a' }],
    });
    expect(appended.ok).toBe(false);
    if (appended.ok) throw new Error('Expected upload rejection');
    expect(appended.error.message).toContain(created.value.id);
    expect(appended.error.message).toContain('version-1');
    expect(appended.error.message).toContain('may be incomplete');
    expect(
      items
        .get(`${created.value.id}/version-0`)
        ?.filter((item) => !isUploadControl(item))
    ).toMatchObject([{ input: 'original' }]);
  });

  it('should batch final case outcomes and report a failed run without auto-queuing work', async () => {
    const provider = voltops({
      publicKey: 'fixture-public',
      secretKey: 'fixture-secret',
      baseUrl: url,
    });
    providers.push(provider);
    const initialized = await provider.initialize();
    if (!initialized.ok) throw initialized.error;
    const created = await provider.evals!.create({
      name: 'batch',
      config: { aggregation: 'mean', threshold: 1, scorerNames: ['exact'] },
    });
    if (!created.ok) throw created.error;
    const params = {
      evalRunId: created.value.id,
      input: 'q',
      expected: 'a',
      output: 'a',
      scores: [{ name: 'exact', score: 1 }],
      meanScore: 1,
      medianScore: 1,
      sumScore: 1,
      passed: true,
    };
    expect(
      await provider.evals!.addResults!([
        params,
        {
          ...params,
          passed: false,
          metadata: { executionError: 'task failed' },
        },
      ])
    ).toMatchObject({ ok: true, value: [{ passed: true }, { passed: false }] });
    expect(
      requests.filter((request) => request.path.endsWith('/results'))
    ).toHaveLength(1);
    expect(
      requests.find((request) => request.path.endsWith('/results'))?.body
    ).toMatchObject({
      results: [
        { status: 'passed' },
        { status: 'error', thresholdPassed: false },
      ],
    });
    expect(
      await provider.evals!.complete({
        id: created.value.id,
        status: 'failed',
        summary: {
          meanScore: 1,
          medianScore: 1,
          sumScore: 2,
          passedCount: 1,
          failedCount: 1,
          totalCount: 2,
          passed: false,
        },
      })
    ).toMatchObject({ ok: true, value: { status: 'failed' } });
    expect(
      requests.find((request) => request.path.endsWith('/complete'))?.body
    ).toMatchObject({
      status: 'failed',
      summary: { successCount: 1, failureCount: 1, passRate: 0.5 },
    });
    expect(await provider.evals!.list()).toMatchObject({ ok: false });
    expect(await provider.evals!.get({ id: 'other-session' })).toMatchObject({
      ok: false,
    });
  });
  it('should propagate rejected result uploads without completing the hosted run', async () => {
    const provider = voltops({
      publicKey: 'fixture-public',
      secretKey: 'fixture-secret',
      baseUrl: url,
    });
    providers.push(provider);
    await provider.initialize();
    const created = await provider.evals!.create({
      name: 'rejected',
      config: { aggregation: 'mean', threshold: 1, scorerNames: [] },
    });
    if (!created.ok) throw created.error;
    failure = '/evals/runs/';
    expect(
      await provider.evals!.addResult({
        evalRunId: created.value.id,
        input: 'q',
        expected: 'a',
        output: 'a',
        scores: [],
        meanScore: 1,
        medianScore: 1,
        sumScore: 1,
        passed: true,
      })
    ).toMatchObject({ ok: false });
    expect(requests.some((request) => request.path.endsWith('/complete'))).toBe(
      false
    );
    expect(await provider.evals!.get({ id: created.value.id })).toMatchObject({
      ok: true,
      value: { status: 'running' },
    });
  });
});

function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error('Invalid fixture array');
  return value;
}

function isUploadControl(value: Record<string, unknown>): boolean {
  const metadata = value.metadata ?? value.extra;
  return (
    typeof metadata === 'object' &&
    metadata !== null &&
    '__viteval_upload' in metadata
  );
}
