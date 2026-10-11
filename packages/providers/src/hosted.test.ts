import { createServer, type Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Provider } from '@viteval/core';
import { langfuse } from '#/langfuse/provider';
import { voltops } from '#/voltops/provider';
import { requireRecord } from '#/remote-record';

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
  metadata: Record<string, unknown>;
}[];
let datasets: Map<string, Record<string, unknown>>;
let items: Map<string, Record<string, unknown>[]>;
let failure: string | undefined;

beforeEach(async () => {
  providers = [];
  requests = [];
  observations = [];
  datasets = new Map();
  items = new Map();
  failure = undefined;
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
        id: `item-${current.length}`,
        datasetId: id,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      };
      items.set(id, [...current, item]);
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
      const matching = observations.filter(
        (observation) =>
          observation.name === parsed.searchParams.get('name') &&
          (!parsed.searchParams.get('sessionId') ||
            observation.sessionId === parsed.searchParams.get('sessionId'))
      );
      const offset = Number(parsed.searchParams.get('cursor') ?? 0);
      result = {
        data: matching.slice(offset, offset + 1),
        meta: {
          cursor: offset + 1 < matching.length ? String(offset + 1) : null,
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
            itemCount: current.length + 1,
          })),
        });
        result = item;
      } else {
        const offset = Number(parsed.searchParams.get('offset') ?? 0);
        result = {
          items: current.slice(offset, offset + 1),
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
    response.end(JSON.stringify(result));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('Missing fixture server address');
  url = `http://127.0.0.1:${address.port}`;
});
afterEach(async () => {
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
  }
);

describe('Langfuse remote history', () => {
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
    items.set(created.value.id, [
      { ...records[0], status: 'ARCHIVED' },
      records[1],
    ]);
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
    expect(
      await fresh.evals!.get({ id: created.value.id, includeResults: true })
    ).toMatchObject({
      ok: true,
      value: {
        status: 'completed',
        results: [expect.anything(), expect.anything()],
      },
    });
    expect(await fresh.evals!.list({ status: 'completed' })).toMatchObject({
      ok: true,
      value: [{ id: created.value.id, config: { threshold: 1 } }],
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
