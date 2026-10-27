import { randomUUID } from 'node:crypto';
import type { VoltOpsRestClient, EvalDatasetDetail } from '@voltagent/sdk';
import { attemptAsync, err } from 'massaman/control';
import type { DatasetProvider, StoredDataset } from '@viteval/core';
import { serializeJson } from '@viteval/internal';
import { jsonValue, requireRecord } from '#/remote-record';

const MANAGED_DESCRIPTION = 'viteval:dataset-upload:v1\n';
const UPLOAD = '__viteval_upload';

/** Create hosted VoltOps dataset operations over its SDK and published upload routes.
 * @param client - Initialized hosted SDK.
 * @returns Versioned dataset reads and uploads.
 * @example const datasets = createVoltOpsDatasets(client);
 */
export function createVoltOpsDatasets(
  client: VoltOpsRestClient
): DatasetProvider {
  async function request(params: { path: string; body: unknown }) {
    const response = await client.httpClient.sendRequest(params.path, {
      method: 'POST',
      body: serializeJson(params.body),
    });
    if (!response.ok)
      throw new Error(
        `VoltOps dataset upload failed (${response.status}): ${await response.text()}`
      );
    return response;
  }
  async function identifier(params: { path: string; body: unknown }) {
    const body = requireRecord(await (await request(params)).json());
    if (typeof body.id !== 'string')
      throw new Error('VoltOps did not return a dataset/version ID');
    return body.id;
  }
  async function detail(id: string) {
    const dataset = await client.getDataset(id);
    if (!dataset) throw new Error(`VoltOps dataset not found: ${id}`);
    return dataset;
  }
  async function items(dataset: EvalDatasetDetail) {
    const managed = dataset.description?.startsWith(MANAGED_DESCRIPTION);
    const versionId = dataset.versions[0]?.id;
    if (!versionId) {
      if (managed) throw incomplete(dataset);
      return [];
    }
    const records: Awaited<
      ReturnType<VoltOpsRestClient['listDatasetItems']>
    >['items'] = [];
    while (true) {
      const response = await client.listDatasetItems(dataset.id, versionId, {
        offset: records.length,
        limit: 200,
      });
      if (!response.items.length) {
        if (records.length < response.total)
          throw new Error(
            'VoltOps dataset pagination ended before all items were returned'
          );
        break;
      }
      if (
        response.items.some((item) =>
          records.some((record) => record.id === item.id)
        )
      )
        throw new Error('VoltOps returned a repeated dataset page');
      records.push(...response.items);
      if (records.length >= response.total) break;
    }
    const controls = records.filter(
      (item) => item.extra && UPLOAD in item.extra
    );
    if (managed || controls.length) {
      if (controls.length !== 2) throw incomplete(dataset);
      const markers = controls.map((item) =>
        requireRecord(item.extra![UPLOAD])
      );
      const begin = markers.find((marker) => marker.state === 'pending');
      const commit = markers.find((marker) => marker.state === 'complete');
      if (
        !begin ||
        !commit ||
        begin.schemaVersion !== 1 ||
        commit.schemaVersion !== 1 ||
        typeof begin.id !== 'string' ||
        begin.id !== commit.id ||
        begin.id.length === 0
      )
        throw incomplete(dataset);
    }
    return records
      .filter((item) => !item.extra || !(UPLOAD in item.extra))
      .map((item, ordinal) => ({
        id: item.id,
        datasetId: dataset.id,
        ordinal,
        input: item.input,
        expected: item.expected,
        extra: {
          ...item.extra,
          ...(item.label ? { name: item.label } : {}),
          datasetVersionId: versionId,
        },
      }));
  }
  async function upload(params: {
    datasetId: string;
    items: {
      input: unknown;
      expected: unknown;
      extra?: Record<string, unknown>;
    }[];
    metadata?: Record<string, unknown>;
  }) {
    jsonValue(params);
    validateItems(params.items);
    const uploadId = randomUUID();
    let versionId: string | undefined;
    try {
      versionId = await identifier({
        path: `/evals/datasets/${encodeURIComponent(params.datasetId)}/versions`,
        body: { metadata: params.metadata ?? null },
      });
      const journal = (state: 'pending' | 'complete') =>
        request({
          path: `/evals/datasets/${encodeURIComponent(params.datasetId)}/versions/${encodeURIComponent(versionId!)}/items`,
          body: {
            input: null,
            expected: null,
            label: 'viteval:upload-control',
            extra: { [UPLOAD]: { schemaVersion: 1, id: uploadId, state } },
          },
        });
      await journal('pending');
      for (const item of params.items)
        await request({
          path: `/evals/datasets/${encodeURIComponent(params.datasetId)}/versions/${encodeURIComponent(versionId)}/items`,
          body: {
            input: item.input,
            expected: item.expected ?? null,
            extra: item.extra ?? null,
            label:
              typeof item.extra?.name === 'string' ? item.extra.name : null,
          },
        });
      await journal('complete');
    } catch (error) {
      throw new Error(
        `VoltOps dataset ${params.datasetId} version ${versionId ?? '(unknown)'} may be incomplete after upload failure: ${error instanceof Error ? error.message : String(error)}. Inspect the version in the VoltOps console before retrying or reading the latest version.`,
        { cause: error }
      );
    }
    return detail(params.datasetId);
  }
  async function mapped(dataset: EvalDatasetDetail): Promise<StoredDataset> {
    const cases = await items(dataset);
    let description = dataset.description ?? undefined;
    if (description?.startsWith(MANAGED_DESCRIPTION)) {
      const metadata = requireRecord(
        JSON.parse(description.slice(MANAGED_DESCRIPTION.length))
      );
      if (
        metadata.description !== null &&
        typeof metadata.description !== 'string'
      )
        throw new Error('Invalid Viteval dataset description');
      description = metadata.description ?? undefined;
    }
    return { ...mapDataset(dataset), description, itemCount: cases.length };
  }
  return {
    create: (params) =>
      attemptAsync(async () => {
        if (!params.name.trim())
          throw new Error('Dataset name must not be empty');
        jsonValue(params);
        validateItems(params.items ?? []);
        const existing = await client.getDatasetByName(params.name);
        if (existing) {
          await mapped(existing);
          throw new Error(`VoltOps dataset already exists: ${params.name}`);
        }
        const datasetId = await identifier({
          path: '/evals/datasets',
          body: {
            name: params.name,
            description: `${MANAGED_DESCRIPTION}${serializeJson({ description: params.description ?? null })}`,
            metadata: params.metadata ?? null,
          },
        });
        const dataset = await upload({
          datasetId,
          items: params.items ?? [],
          metadata: params.metadata,
        });
        return mapped(dataset);
      }),
    get: (params) =>
      attemptAsync(async () => {
        const dataset = params.id
          ? await client.getDataset(params.id)
          : await client.getDatasetByName(params.name!);
        return dataset ? mapped(dataset) : null;
      }),
    list: (params) =>
      attemptAsync(async () => {
        const records = (await client.listDatasets()).slice(
          params?.offset ?? 0,
          params?.limit === undefined
            ? undefined
            : (params.offset ?? 0) + params.limit
        );
        return Promise.all(
          records.map(async (dataset) => mapped(await detail(dataset.id)))
        );
      }),
    getItems: (params) =>
      attemptAsync(async () =>
        (await items(await detail(params.datasetId))).slice(
          params.offset ?? 0,
          params.limit === undefined
            ? undefined
            : (params.offset ?? 0) + params.limit
        )
      ),
    addItems: (params) =>
      attemptAsync(async () => {
        jsonValue(params.items);
        const dataset = await detail(params.datasetId);
        if (!dataset.description?.startsWith(MANAGED_DESCRIPTION))
          throw new Error(
            'VoltOps cannot safely append to an unmanaged dataset; create a new Viteval dataset instead'
          );
        const current = await items(dataset);
        await upload({
          datasetId: params.datasetId,
          items: [...current, ...params.items],
        });
      }),
    replaceItems: () =>
      Promise.resolve(
        err(
          'VoltOps uploads create versions through multiple requests; atomic replacement is not exposed by its SDK'
        )
      ),
    update: () =>
      Promise.resolve(
        err(
          'The VoltOps SDK does not expose dataset update/rename; manage datasets in the VoltOps console'
        )
      ),
    delete: () =>
      Promise.resolve(
        err(
          'The VoltOps SDK does not expose dataset deletion; manage datasets in the VoltOps console'
        )
      ),
  };
}

function incomplete(dataset: EvalDatasetDetail): Error {
  return new Error(
    `VoltOps dataset ${dataset.id} version ${dataset.versions[0]?.id ?? '(unknown)'} has an incomplete Viteval upload. Inspect and remove the incomplete dataset/version in the VoltOps console before retrying; no cases from it can be reused.`
  );
}

function validateItems(items: { extra?: Record<string, unknown> }[]): void {
  for (const item of items) {
    if (item.extra && UPLOAD in item.extra)
      throw new Error(
        `Dataset item metadata key ${UPLOAD} is reserved by Viteval`
      );
  }
}

function mapDataset(dataset: EvalDatasetDetail): StoredDataset {
  const version = dataset.versions[0];
  return {
    id: dataset.id,
    name: dataset.name,
    description: dataset.description ?? undefined,
    version: version?.version ?? 1,
    itemCount: version?.itemCount ?? 0,
    metadata: { datasetVersionId: version?.id, tags: dataset.tags ?? [] },
    createdAt: new Date(dataset.createdAt),
    updatedAt: new Date(dataset.updatedAt),
  };
}
