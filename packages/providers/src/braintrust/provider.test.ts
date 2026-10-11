import { createServer, type Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { braintrust } from './provider';

let server: Server;
let baseUrl: string;
let requests: { method: string; path: string; body: unknown }[];
let experiment: Record<string, unknown>;

beforeEach(async () => {
  requests = [];
  experiment = {};
  server = createServer(async (request, response) => {
    let text = '';
    for await (const chunk of request) text += String(chunk);
    const body: unknown = text ? JSON.parse(text) : undefined;
    const url = new URL(request.url ?? '/', 'http://localhost');
    requests.push({
      method: request.method ?? '',
      path: `${url.pathname}${url.search}`,
      body,
    });
    response.setHeader('content-type', 'application/json');
    let result: unknown;
    if (url.pathname === '/v1/project')
      result = { objects: [{ id: 'project', name: 'test-project' }] };
    else if (url.pathname === '/v1/dataset' && request.method === 'POST')
      result = {
        ...record(body),
        id: 'dataset',
        created: new Date().toISOString(),
      };
    else if (url.pathname === '/v1/dataset/dataset/fetch')
      result = record(body).cursor
        ? { events: [{ id: 'second', input: 'second', expected: 'SECOND' }] }
        : {
            events: [{ id: 'first', input: 'first', expected: 'FIRST' }],
            cursor: 'page-two',
          };
    else if (url.pathname === '/v1/dataset/dataset/insert')
      result = { row_ids: ['first', 'second'] };
    else if (url.pathname === '/v1/experiment' && request.method === 'POST') {
      experiment = {
        ...record(body),
        id: 'experiment',
        created: new Date().toISOString(),
      };
      result = experiment;
    } else if (
      url.pathname === '/v1/experiment/experiment' &&
      request.method === 'PATCH'
    ) {
      experiment = { ...experiment, ...record(body) };
      result = experiment;
    } else if (url.pathname === '/v1/experiment/experiment')
      result = experiment;
    else if (url.pathname === '/v1/experiment/experiment/insert')
      result = { row_ids: ['result-one'] };
    else if (url.pathname === '/v1/experiment/experiment/fetch')
      result = record(body).cursor
        ? {
            events: [
              {
                id: 'second-result',
                input: 'second',
                output: 'SECOND',
                scores: { exact: 1 },
                metadata: { _viteval_passed: true },
              },
            ],
          }
        : {
            events: [
              {
                id: 'first-result',
                input: 'first',
                output: 'FIRST',
                scores: { exact: 1 },
                metadata: { _viteval_passed: true },
              },
            ],
            cursor: 'page-two',
          };
    else {
      response.statusCode = 404;
      result = { message: 'not found' };
    }
    response.end(JSON.stringify(result));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('Fixture server address unavailable');
  baseUrl = `http://127.0.0.1:${address.port}`;
});
afterEach(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve()))
  );
});

describe('Braintrust HTTP contract', () => {
  it('should paginate datasets and replace items with a single insertion request', async () => {
    const provider = braintrust({
      project: 'test-project',
      apiKey: 'test-only-key',
      baseUrl,
    });
    const initialized = await provider.initialize();
    if (!initialized.ok) throw initialized.error;
    const created = await provider.datasets!.create({ name: 'questions' });
    expect(created).toMatchObject({ ok: true, value: { id: 'dataset' } });
    expect(
      await provider.datasets!.getItems({ datasetId: 'dataset' })
    ).toMatchObject({
      ok: true,
      value: [
        { input: 'first', ordinal: 0 },
        { input: 'second', ordinal: 1 },
      ],
    });
    const replaced = await provider.datasets!.replaceItems!({
      datasetId: 'dataset',
      items: [{ input: 'new', expected: 'NEW' }],
    });
    expect(replaced, replaced.error?.message).toMatchObject({ ok: true });
    expect(
      requests.find((request) => request.path === '/v1/dataset/dataset/insert')
        ?.body
    ).toEqual({
      events: [
        { id: 'first', _object_delete: true },
        { id: 'second', _object_delete: true },
        { input: 'new', expected: 'NEW' },
      ],
    });
  });

  it('should retain configuration on completion and fetch every result page', async () => {
    const provider = braintrust({
      project: 'test-project',
      apiKey: 'test-only-key',
      baseUrl,
    });
    const initialized = await provider.initialize();
    if (!initialized.ok) throw initialized.error;
    const created = await provider.evals!.create({
      name: 'accuracy',
      config: { aggregation: 'mean', threshold: 0.8, scorerNames: ['exact'] },
    });
    if (!created.ok) throw created.error;
    expect(created.value.name).toBe('accuracy');
    expect(experiment.name).not.toBe('accuracy');
    const added = await provider.evals!.addResult({
      evalRunId: 'experiment',
      input: 'first',
      expected: 'FIRST',
      output: 'FIRST',
      scores: [{ name: 'exact', score: 1 }],
      meanScore: 1,
      medianScore: 1,
      sumScore: 1,
      passed: true,
    });
    expect(added).toMatchObject({ ok: true, value: { id: 'result-one' } });
    const completed = await provider.evals!.complete({
      id: 'experiment',
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
    expect(completed).toMatchObject({
      ok: true,
      value: { config: { threshold: 0.8 }, status: 'completed' },
    });
    const loaded = await provider.evals!.get({
      id: 'experiment',
      includeResults: true,
    });
    expect(loaded).toMatchObject({
      ok: true,
      value: {
        name: 'accuracy',
        config: { threshold: 0.8 },
        results: [{ id: 'first-result' }, { id: 'second-result' }],
      },
    });
  });
});

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value))
    : {};
}
