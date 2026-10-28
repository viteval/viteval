import { createServer, type Server } from 'node:http';
import Braintrust from '@braintrust/api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { braintrust } from './provider';
import { createBraintrustDatasetOps } from './datasets';

let server: Server;
let baseUrl: string;
let requests: { method: string; path: string; body: unknown }[];
let experiment: Record<string, unknown>;
let dataset: (Braintrust.Dataset & { url_slug: string }) | undefined;
let datasetUpdateStatus: 200 | 400 | 403;
let datasetDeleteStatus: 200 | 403;
let repeatedCursor: boolean;
let resultIds: string[];
let missingProject: boolean;
let foreignEvents: boolean;
let rejectProject: boolean;
let datasetEvents: Map<string, Record<string, unknown>>;
let rejectDatasetData: boolean;
let rejectDatasetCommit: boolean;
let partialDatasetEvents: Record<string, unknown>[];
let ignoreDatasetNameFilter: boolean;

beforeEach(async () => {
  requests = [];
  experiment = {};
  dataset = undefined;
  datasetUpdateStatus = 200;
  datasetDeleteStatus = 200;
  repeatedCursor = false;
  resultIds = ['result-one'];
  missingProject = false;
  foreignEvents = false;
  rejectProject = false;
  datasetEvents = new Map();
  rejectDatasetData = false;
  rejectDatasetCommit = false;
  partialDatasetEvents = [];
  ignoreDatasetNameFilter = false;
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
    if (rejectProject && url.pathname === '/v1/project') {
      response.statusCode = 403;
      response.end(JSON.stringify({ message: 'Project access denied' }));
      return;
    }
    let result: unknown;
    if (url.pathname === '/v1/project')
      result =
        request.method === 'POST'
          ? { id: 'new-project', ...record(body) }
          : {
              objects: missingProject
                ? url.searchParams.has('starting_after')
                  ? []
                  : [{ id: 'unrelated', name: 'unrelated' }]
                : [{ id: 'project', name: 'test-project' }],
            };
    else if (url.pathname === '/v1/dataset' && request.method === 'POST') {
      const fields = record(body);
      if (
        typeof fields.name !== 'string' ||
        !fields.name.trim() ||
        typeof fields.project_id !== 'string' ||
        Object.keys(fields).some(
          (key) => !['name', 'project_id', 'description'].includes(key)
        )
      ) {
        response.statusCode = 400;
        result = {
          message: 'Invalid @braintrust/api 0.5 dataset create parameters',
        };
      } else {
        datasetEvents = new Map();
        dataset = {
          name: fields.name,
          project_id: fields.project_id,
          description:
            typeof fields.description === 'string' ? fields.description : null,
          id: 'dataset',
          url_slug: 'questions',
          created: new Date().toISOString(),
          deleted_at: null,
          metadata: {},
        };
        result = dataset;
      }
    } else if (url.pathname === '/v1/dataset' && request.method === 'GET') {
      result = {
        objects:
          !url.searchParams.has('starting_after') &&
          dataset &&
          (ignoreDatasetNameFilter ||
            !url.searchParams.get('dataset_name') ||
            url.searchParams.get('dataset_name') === dataset.name)
            ? [dataset, { ...dataset, id: 'other', name: 'other' }]
            : [],
      };
    } else if (
      url.pathname === '/v1/dataset/dataset' &&
      request.method === 'PATCH'
    ) {
      const fields = record(body);
      if (datasetUpdateStatus !== 200) {
        response.statusCode = datasetUpdateStatus;
        result = { message: 'Dataset metadata update rejected' };
      } else if (
        !dataset ||
        (fields.metadata !== undefined && !isMetadataRecord(fields.metadata)) ||
        Object.keys(fields).some(
          (key) => !['name', 'description', 'metadata'].includes(key)
        )
      ) {
        response.statusCode = 400;
        result = { message: 'Invalid dataset patch parameters' };
      } else {
        dataset = {
          ...dataset,
          ...(typeof fields.name === 'string' ? { name: fields.name } : {}),
          ...(typeof fields.description === 'string'
            ? { description: fields.description }
            : {}),
          metadata: { ...dataset.metadata, ...fields.metadata },
        };
        result = dataset;
      }
    } else if (
      url.pathname === '/v1/dataset/dataset' &&
      request.method === 'DELETE'
    ) {
      response.statusCode = datasetDeleteStatus;
      result =
        datasetDeleteStatus === 200
          ? dataset
          : { message: 'Dataset deletion rejected' };
      if (datasetDeleteStatus === 200) dataset = undefined;
    } else if (
      url.pathname === '/v1/dataset/dataset' &&
      request.method === 'GET'
    )
      result = dataset ?? {
        id: 'dataset',
        name: 'external',
        metadata: {},
        created: new Date().toISOString(),
      };
    else if (/^\/v1\/dataset\/[^/]+\/fetch$/.test(url.pathname)) {
      const events = [...datasetEvents.values()];
      result = record(body).cursor
        ? {
            events: events.slice(1),
            ...(repeatedCursor ? { cursor: 'page-two' } : {}),
          }
        : {
            events: events.slice(0, 1),
            ...(events.length > 1 || repeatedCursor
              ? { cursor: 'page-two' }
              : {}),
          };
    } else if (url.pathname === '/v1/dataset/dataset/insert') {
      const events = record(body).events;
      if (!Array.isArray(events)) throw new Error('Expected dataset events');
      const cases = events.map(record).filter((event) => !isUploadEvent(event));
      const isCommit = events
        .map(record)
        .some(
          (event) =>
            isUploadEvent(event) &&
            record(record(event.metadata).__viteval_upload).state === 'complete'
        );
      if (
        (rejectDatasetData && cases.length) ||
        (rejectDatasetCommit && isCommit)
      ) {
        partialDatasetEvents.push(...cases.slice(0, 1));
        if (cases[0]) persistDatasetEvent(cases[0]);
        response.statusCode = 400;
        response.end(JSON.stringify({ message: 'Dataset upload interrupted' }));
        return;
      }
      result = {
        row_ids: events.map((event) => persistDatasetEvent(record(event))),
      };
    } else if (url.pathname === '/v1/experiment' && request.method === 'GET') {
      result = {
        objects: url.searchParams.has('starting_after')
          ? []
          : [
              { id: 'unrelated', name: 'unrelated', dataset_id: 'unrelated' },
              { id: 'running', name: 'running', dataset_id: 'dataset' },
              experiment,
              { ...experiment, id: 'last' },
            ],
      };
    } else if (url.pathname === '/v1/experiment' && request.method === 'POST') {
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
      result = { row_ids: resultIds };
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
            ...(repeatedCursor ? { cursor: 'page-two' } : {}),
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
    if (foreignEvents && url.pathname === '/v1/experiment/experiment/fetch') {
      result = {
        events: [
          {
            id: 'foreign',
            input: 'q',
            output: 'a',
            scores: { missing: null, absent: undefined, exact: 1 },
            metrics: { end: 0.05 },
            metadata: {
              _viteval_mean_score: 1,
              _viteval_median_score: 1,
              _viteval_sum_score: 1,
              _viteval_passed: true,
              source: 'test',
            },
          },
          { id: 'empty', input: null, output: null, metrics: { end: null } },
        ],
      };
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
  vi.restoreAllMocks();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve()))
  );
});

describe('Braintrust HTTP contract', () => {
  it('should verify exact dataset identity even when the remote name filter returns unrelated records', async () => {
    const provider = braintrust({
      project: 'test-project',
      apiKey: 'fixture',
      baseUrl,
    });
    await provider.initialize();
    await provider.datasets!.create({ name: 'unrelated' });
    ignoreDatasetNameFilter = true;
    expect(await provider.datasets!.get({ name: 'missing' })).toMatchObject({
      ok: true,
      value: null,
    });
    expect(await provider.datasets!.create({ name: 'target' })).toMatchObject({
      ok: true,
      value: { name: 'target' },
    });
    expect(await provider.datasets!.get({ name: 'other' })).toMatchObject({
      ok: true,
      value: { name: 'other' },
    });
  });
  it('should return rejected project discovery through Result', async () => {
    rejectProject = true;
    const provider = braintrust({
      project: 'test-project',
      apiKey: 'fixture',
      baseUrl,
    });
    expect(await provider.initialize()).toMatchObject({
      ok: false,
      error: { status: 403 },
    });
    expect(provider.datasets).toBeUndefined();
  });
  it('should preserve non-Error SDK upload failures when orphan cleanup fails', async () => {
    const client = new Braintrust({ apiKey: 'fixture', baseURL: baseUrl });
    vi.spyOn(client.datasets, 'insert').mockRejectedValue(
      'non-error upload failure'
    );
    vi.spyOn(client.datasets, 'delete').mockRejectedValue(
      new Error('cleanup denied')
    );
    const datasets = createBraintrustDatasetOps(
      async () => client,
      () => 'project'
    );
    const result = await datasets.create({
      name: 'partial',
      items: [{ input: 'q', expected: 'a' }],
    });
    expect(result).toMatchObject({
      ok: false,
      error: {
        message: expect.stringContaining('non-error upload failure'),
        cause: 'non-error upload failure',
      },
    });
  });
  it('should accept an explicitly empty initial item list', async () => {
    const provider = braintrust({
      project: 'test-project',
      apiKey: 'fixture',
      baseUrl,
    });
    await provider.initialize();
    expect(
      await provider.datasets!.create({ name: 'empty', items: [] })
    ).toMatchObject({ ok: true, value: { itemCount: 0 } });
  });
  it('should create missing projects and map sparse external records', async () => {
    missingProject = true;
    const provider = braintrust({
      project: 'test-project',
      apiKey: 'fixture',
      baseUrl,
    });
    expect((await provider.initialize()).ok).toBe(true);
    expect(
      requests.find(
        (request) => request.method === 'POST' && request.path === '/v1/project'
      )?.body
    ).toEqual({ name: 'test-project' });
    await provider.datasets!.create({ name: 'sparse', items: [] });
    if (!dataset) throw new Error('Missing fixture dataset');
    dataset = { ...dataset, created: null, metadata: null };
    expect(await provider.datasets!.get({ id: 'dataset' })).toMatchObject({
      ok: true,
      value: {
        metadata: {},
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      },
    });
    foreignEvents = true;
    experiment = { id: 'experiment', name: 'foreign' };
    expect(
      await provider.evals!.get({ id: 'experiment', includeResults: true })
    ).toMatchObject({
      ok: true,
      value: {
        results: [
          {
            duration: 50,
            meanScore: 1,
            medianScore: 1,
            sumScore: 1,
            passed: true,
            scores: [{ name: 'exact', score: 1 }],
            metadata: { source: 'test' },
          },
          {
            duration: undefined,
            meanScore: 0,
            medianScore: 0,
            sumScore: 0,
            passed: false,
            scores: [],
            metadata: {},
          },
        ],
      },
    });
  });
  it('should create and append items, query names, paginate lists, rename and delete datasets', async () => {
    const provider = braintrust({
      project: 'test-project',
      apiKey: 'test-only-key',
      baseUrl,
    });
    expect((await provider.initialize()).ok).toBe(true);
    expect((await provider.initialize()).ok).toBe(true);
    const datasets = provider.datasets!;
    expect(
      await datasets.create({
        name: 'questions',
        items: [
          { input: 'first', expected: 'FIRST', extra: { context: 'ref' } },
        ],
      })
    ).toMatchObject({ ok: true, value: { itemCount: 1 } });
    expect(
      await datasets.addItems({
        datasetId: 'dataset',
        items: [
          { input: 'second', expected: 'SECOND', extra: { category: 'test' } },
        ],
      })
    ).toMatchObject({ ok: true });
    expect(await datasets.get({ name: 'questions' })).toMatchObject({
      ok: true,
      value: { id: 'dataset' },
    });
    expect(await datasets.get({ name: 'missing' })).toMatchObject({
      ok: true,
      value: null,
    });
    expect(await datasets.get({})).toMatchObject({ ok: true, value: null });
    expect(await datasets.list()).toMatchObject({
      ok: true,
      value: [{ id: 'dataset' }, { id: 'other' }],
    });
    expect(await datasets.list({ limit: 1 })).toMatchObject({
      ok: true,
      value: [{ id: 'dataset' }],
    });
    expect(await datasets.list({ offset: 1, limit: 1 })).toMatchObject({
      ok: true,
      value: [{ id: 'other' }],
    });
    expect(await datasets.list({ offset: 1 })).toMatchObject({
      ok: true,
      value: [{ id: 'other' }],
    });
    expect(
      await datasets.getItems({ datasetId: 'dataset', limit: 0 })
    ).toMatchObject({ ok: true, value: [] });
    expect(
      await datasets.getItems({ datasetId: 'dataset', offset: 1, limit: 1 })
    ).toMatchObject({ ok: true, value: [{ input: 'second', ordinal: 1 }] });
    expect(
      await datasets.getItems({ datasetId: 'dataset', limit: 1 })
    ).toMatchObject({ ok: true, value: [{ input: 'first' }] });
    expect(
      await datasets.update({
        id: 'dataset',
        name: 'renamed',
        description: 'updated',
        metadata: { revision: 2 },
      })
    ).toMatchObject({
      ok: true,
      value: { name: 'renamed', description: 'updated' },
    });
    expect(await datasets.update({ id: 'dataset' })).toMatchObject({
      ok: true,
    });
    expect(await datasets.delete({ id: 'dataset' })).toMatchObject({
      ok: true,
    });
    expect(await provider.close()).toMatchObject({ ok: true });
  });

  it('should reject repeated dataset and experiment cursors', async () => {
    const provider = braintrust({
      project: 'test-project',
      apiKey: 'test-only-key',
      baseUrl,
    });
    await provider.initialize();
    repeatedCursor = true;
    expect(
      await provider.datasets!.getItems({ datasetId: 'dataset' })
    ).toMatchObject({
      ok: false,
      error: { message: 'Braintrust returned a repeated dataset cursor' },
    });
    experiment = { id: 'experiment', name: 'foreign' };
    expect(
      await provider.evals!.get({ id: 'experiment', includeResults: true })
    ).toMatchObject({
      ok: false,
      error: { message: 'Braintrust returned a repeated experiment cursor' },
    });
  });

  it('should validate batch identity and returned result IDs', async () => {
    const provider = braintrust({
      project: 'test-project',
      apiKey: 'test-only-key',
      baseUrl,
    });
    await provider.initialize();
    const params = {
      evalRunId: 'experiment',
      input: 'q',
      expected: 'a',
      output: 'a',
      scores: [{ name: 'exact', score: 1 }],
      duration: 50,
      metadata: { source: 'test' },
      meanScore: 1,
      medianScore: 1,
      sumScore: 1,
      passed: true,
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
      requests.filter((request) => request.path.endsWith('/insert'))
    ).toHaveLength(0);
    expect(await provider.evals!.addResults!([params])).toMatchObject({
      ok: true,
      value: [{ duration: 50, metadata: { source: 'test' } }],
    });
    expect(
      await provider.evals!.addResults!([{ ...params, metadata: undefined }])
    ).toMatchObject({ ok: true, value: [{ metadata: {} }] });
    expect(await provider.evals!.addResults!([params, params])).toMatchObject({
      ok: false,
      error: {
        message: 'Braintrust returned an unexpected number of result IDs',
      },
    });
    resultIds = [];
    expect(await provider.evals!.addResult(params)).toMatchObject({
      ok: false,
      error: { message: 'Braintrust did not return an evaluation result ID' },
    });
  });

  it('should filter experiments before pagination and read foreign experiments with defaults', async () => {
    const provider = braintrust({
      project: 'test-project',
      apiKey: 'test-only-key',
      baseUrl,
    });
    await provider.initialize();
    experiment = {
      id: 'experiment',
      name: 'foreign',
      dataset_id: 'dataset',
      metadata: { _viteval_status: 'failed', customer: 'visible' },
    };
    expect(await provider.evals!.get({ id: 'experiment' })).toMatchObject({
      ok: true,
      value: {
        name: 'foreign',
        status: 'failed',
        config: { threshold: 0.5 },
        metadata: { customer: 'visible' },
      },
    });
    expect(await provider.evals!.list()).toMatchObject({
      ok: true,
      value: expect.any(Array),
    });
    expect(await provider.evals!.list({ limit: 1 })).toMatchObject({
      ok: true,
      value: [{ id: 'unrelated' }],
    });
    expect(await provider.evals!.list({ offset: 1, limit: 1 })).toMatchObject({
      ok: true,
      value: [{ id: 'running' }],
    });
    expect(
      await provider.evals!.list({
        datasetId: 'dataset',
        status: 'failed',
        offset: 1,
        limit: 1,
      })
    ).toMatchObject({ ok: true, value: [{ id: 'last' }] });
  });
  it('should preserve dataset creation metadata through the SDK HTTP boundary', async () => {
    const provider = braintrust({
      project: 'test-project',
      apiKey: 'test-only-key',
      baseUrl,
    });
    const initialized = await provider.initialize();
    if (!initialized.ok) throw initialized.error;
    const metadata = { source: 'release', nested: { revision: 1 } };
    expect(
      await provider.datasets!.create({ name: 'questions', metadata })
    ).toMatchObject({ ok: true, value: { metadata } });
    expect(
      requests.find(
        (request) => request.method === 'POST' && request.path === '/v1/dataset'
      )?.body
    ).toEqual({
      name: expect.stringMatching(/^__viteval_upload_/),
      project_id: 'project',
    });
    expect(
      requests.find(
        (request) =>
          request.method === 'PATCH' && request.path === '/v1/dataset/dataset'
      )?.body
    ).toEqual({
      metadata: { ...metadata, __viteval_initial_upload: expect.any(String) },
    });
    const reader = braintrust({
      project: 'test-project',
      apiKey: 'test-only-key',
      baseUrl,
    });
    const readerInitialized = await reader.initialize();
    if (!readerInitialized.ok) throw readerInitialized.error;
    expect(await reader.datasets!.get({ id: 'dataset' })).toMatchObject({
      ok: true,
      value: { metadata },
    });
    expect(
      requests.some(
        (request) =>
          request.method === 'GET' && request.path === '/v1/dataset/dataset'
      )
    ).toBe(true);
  });

  it.each([400, 403] as const)(
    'should return a failed Result when metadata PATCH is rejected with HTTP %s',
    async (status) => {
      const provider = braintrust({
        project: 'test-project',
        apiKey: 'test-only-key',
        baseUrl,
      });
      const initialized = await provider.initialize();
      if (!initialized.ok) throw initialized.error;
      datasetUpdateStatus = status;
      expect(
        await provider.datasets!.create({
          name: 'questions',
          metadata: { source: 'release' },
          items: [{ input: 'q', expected: 'a' }],
        })
      ).toMatchObject({ ok: false, error: { status } });
      expect(dataset).toBeUndefined();
      expect(
        requests.some(
          (request) => request.path === '/v1/dataset/dataset/insert'
        )
      ).toBe(false);
    }
  );

  it('should persist upload identity and publish even when user metadata is absent', async () => {
    const provider = braintrust({
      project: 'test-project',
      apiKey: 'test-only-key',
      baseUrl,
    });
    const initialized = await provider.initialize();
    if (!initialized.ok) throw initialized.error;
    expect(
      await provider.datasets!.create({ name: 'questions' })
    ).toMatchObject({ ok: true, value: { metadata: {} } });
    expect(
      requests.filter((request) => request.method === 'PATCH')
    ).toHaveLength(2);
  });

  it('should retain the creation failure and orphan ID when cleanup is also rejected', async () => {
    const provider = braintrust({
      project: 'test-project',
      apiKey: 'test-only-key',
      baseUrl,
    });
    const initialized = await provider.initialize();
    if (!initialized.ok) throw initialized.error;
    datasetUpdateStatus = 400;
    datasetDeleteStatus = 403;
    const result = await provider.datasets!.create({
      name: 'questions',
      metadata: { source: 'release' },
    });
    expect(result).toMatchObject({
      ok: false,
      error: { cause: { status: 400 } },
    });
    if (result.ok) throw new Error('Expected a rejected creation');
    expect(result.error.message).toContain('dataset dataset');
    expect(result.error.message).toContain('Dataset metadata update rejected');
    expect(result.error.message).toContain('Cleanup also failed');
    expect(dataset?.id).toBe('dataset');
  });

  it.each(['metadata', 'data', 'commit'] as const)(
    'should block orphaned %s uploads in fresh instances and never publish their requested name',
    async (phase) => {
      const options = {
        project: 'test-project',
        apiKey: 'test-only-key',
        baseUrl,
      };
      const writer = braintrust(options);
      await writer.initialize();
      datasetDeleteStatus = 403;
      datasetUpdateStatus = phase === 'metadata' ? 400 : 200;
      rejectDatasetData = phase === 'data';
      rejectDatasetCommit = phase === 'commit';
      const created = await writer.datasets!.create({
        name: 'interrupted',
        items: [
          { input: 'persisted', expected: 'a' },
          { input: 'missing', expected: 'b' },
        ],
      });
      expect(created).toMatchObject({
        ok: false,
        error: { message: expect.stringContaining('Cleanup also failed') },
      });
      if (phase === 'data')
        expect(partialDatasetEvents).toMatchObject([{ input: 'persisted' }]);
      expect(dataset?.name).toMatch(/^__viteval_upload_/);
      await writer.close();
      const reader = braintrust(options);
      await reader.initialize();
      expect(await reader.datasets!.get({ name: 'interrupted' })).toMatchObject(
        { ok: true, value: null }
      );
      for (const operation of [
        () => reader.datasets!.get({ id: 'dataset' }),
        () => reader.datasets!.list(),
        () => reader.datasets!.getItems({ datasetId: 'dataset', limit: 0 }),
      ])
        expect(await operation()).toMatchObject({
          ok: false,
          error: {
            message: expect.stringContaining('incomplete Viteval upload'),
          },
        });
    }
  );

  it.each(['append', 'replace'] as const)(
    'should durably reject interrupted %s operations across fresh instances',
    async (operation) => {
      const options = {
        project: 'test-project',
        apiKey: 'test-only-key',
        baseUrl,
      };
      const writer = braintrust(options);
      await writer.initialize();
      expect(
        await writer.datasets!.create({
          name: 'published',
          items: [{ input: 'original', expected: 'a' }],
        })
      ).toMatchObject({ ok: true });
      rejectDatasetData = true;
      const write =
        operation === 'append'
          ? writer.datasets!.addItems
          : writer.datasets!.replaceItems!;
      expect(
        await write({
          datasetId: 'dataset',
          items: [{ input: 'new', expected: 'b' }],
        })
      ).toMatchObject({ ok: false });
      await writer.close();
      rejectDatasetData = false;
      const reader = braintrust(options);
      await reader.initialize();
      for (const read of [
        () => reader.datasets!.get({ name: 'published' }),
        () => reader.datasets!.get({ id: 'dataset' }),
        () => reader.datasets!.list(),
        () => reader.datasets!.getItems({ datasetId: 'dataset' }),
        () => reader.datasets!.getItems({ datasetId: 'dataset', limit: 0 }),
        () => reader.datasets!.addItems({ datasetId: 'dataset', items: [] }),
        () =>
          reader.datasets!.replaceItems!({ datasetId: 'dataset', items: [] }),
        () => reader.datasets!.update({ id: 'dataset', metadata: {} }),
        () => reader.datasets!.create({ name: 'published' }),
      ])
        expect(await read()).toMatchObject({
          ok: false,
          error: {
            message: expect.stringContaining('incomplete Viteval upload'),
          },
        });
    }
  );

  it.each([
    { name: '' },
    { name: '__viteval_upload_reserved' },
    { name: 'reserved', metadata: { __viteval_initial_upload: 'forged' } },
    {
      name: 'reserved',
      items: [{ input: 'q', expected: 'a', extra: { __viteval_upload: {} } }],
    },
  ])(
    'should reject reserved upload fields before creating remote data',
    async (params) => {
      const provider = braintrust({
        project: 'test-project',
        apiKey: 'fixture',
        baseUrl,
      });
      await provider.initialize();
      expect(await provider.datasets!.create(params)).toMatchObject({
        ok: false,
      });
      expect(
        requests.some(
          (request) =>
            request.path === '/v1/dataset' && request.method === 'POST'
        )
      ).toBe(false);
    }
  );

  it.each([
    { name: '__viteval_upload_reserved' },
    { metadata: { __viteval_initial_upload: 'forged' } },
  ])(
    'should prevent metadata updates from overwriting upload ownership',
    async (params) => {
      const provider = braintrust({
        project: 'test-project',
        apiKey: 'fixture',
        baseUrl,
      });
      await provider.initialize();
      await provider.datasets!.create({ name: 'protected' });
      expect(
        await provider.datasets!.update({ id: 'dataset', ...params })
      ).toMatchObject({
        ok: false,
        error: {
          message: expect.stringContaining('reserved Viteval upload key'),
        },
      });
    }
  );

  it.each([42, 'missing-control'])(
    'should reject invalid durable initial upload identity %s',
    async (initial) => {
      const provider = braintrust({
        project: 'test-project',
        apiKey: 'fixture',
        baseUrl,
      });
      await provider.initialize();
      await provider.datasets!.create({ name: 'protected' });
      if (!dataset) throw new Error('Missing dataset');
      dataset = { ...dataset, metadata: { __viteval_initial_upload: initial } };
      expect(await provider.datasets!.get({ id: 'dataset' })).toMatchObject({
        ok: false,
        error: {
          message: expect.stringContaining('incomplete Viteval upload'),
        },
      });
    }
  );

  it.each([{ schemaVersion: 2 }, { id: 'wrong' }, { state: 'pending' }])(
    'should reject malformed persisted upload journals $schemaVersion $id $state',
    async (patch) => {
      const provider = braintrust({
        project: 'test-project',
        apiKey: 'fixture',
        baseUrl,
      });
      await provider.initialize();
      await provider.datasets!.create({ name: 'protected' });
      const control = [...datasetEvents.values()].find(isUploadEvent);
      if (!control || typeof control.id !== 'string')
        throw new Error('Missing journal');
      datasetEvents.set(control.id, {
        ...control,
        metadata: {
          __viteval_upload: {
            ...record(record(control.metadata).__viteval_upload),
            ...patch,
          },
        },
      });
      expect(
        await provider.datasets!.getItems({ datasetId: 'dataset', limit: 0 })
      ).toMatchObject({ ok: false });
    }
  );

  it('should read complete empty uploads in fresh instances and preserve unmanaged metadata updates', async () => {
    const options = { project: 'test-project', apiKey: 'fixture', baseUrl };
    const writer = braintrust(options);
    await writer.initialize();
    await writer.datasets!.create({ name: 'empty', items: [] });
    await writer.close();
    const reader = braintrust(options);
    await reader.initialize();
    expect(await reader.datasets!.get({ name: 'empty' })).toMatchObject({
      ok: true,
      value: { itemCount: 0 },
    });
    expect(
      await reader.datasets!.getItems({ datasetId: 'dataset' })
    ).toMatchObject({ ok: true, value: [] });
    expect(await reader.datasets!.create({ name: 'empty' })).toMatchObject({
      ok: false,
      error: { message: expect.stringContaining('already exists') },
    });
    if (!dataset) throw new Error('Missing dataset');
    dataset = { ...dataset, metadata: null };
    expect(
      await reader.datasets!.update({
        id: 'dataset',
        metadata: { owner: 'user' },
      })
    ).toMatchObject({ ok: true, value: { metadata: { owner: 'user' } } });
  });

  it('should paginate datasets and journal replacement around its data insertion', async () => {
    const provider = braintrust({
      project: 'test-project',
      apiKey: 'test-only-key',
      baseUrl,
    });
    const initialized = await provider.initialize();
    if (!initialized.ok) throw initialized.error;
    const created = await provider.datasets!.create({
      name: 'questions',
      items: [
        { input: 'first', expected: 'FIRST' },
        { input: 'second', expected: 'SECOND' },
      ],
    });
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
      requests.find(
        (request) =>
          request.path === '/v1/dataset/dataset/insert' &&
          JSON.stringify(request.body).includes('_object_delete')
      )?.body
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

function isMetadataRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isUploadEvent(event: Record<string, unknown>): boolean {
  return '__viteval_upload' in record(event.metadata);
}

function persistDatasetEvent(event: Record<string, unknown>): string {
  const count = [...datasetEvents.values()].filter(
    (value) => !isUploadEvent(value)
  ).length;
  const id =
    typeof event.id === 'string'
      ? event.id
      : count === 0
        ? 'first'
        : count === 1
          ? 'second'
          : `case-${count}`;
  if (event._object_delete) datasetEvents.delete(id);
  else datasetEvents.set(id, { ...event, id });
  return id;
}
