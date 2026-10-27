import { randomUUID } from 'node:crypto';
import type { LangfuseClient } from '@langfuse/client';
import { attemptAsync, err } from 'massaman/control';
import type {
  CreateDatasetParams,
  DatasetProvider,
  StoredDataset,
} from '@viteval/core';
import { jsonValue, requireRecord } from '#/remote-record';

type Dataset = Awaited<ReturnType<LangfuseClient['api']['datasets']['get']>>;
interface AddParams {
  datasetName: string;
  items: NonNullable<CreateDatasetParams['items']>;
}

const INITIAL_UPLOAD = '__viteval_initial_upload';
const UPLOAD = '__viteval_upload';

/** Create dataset operations using the current Langfuse SDK.
 * @param client - Initialized project SDK.
 * @returns Supported hosted dataset operations; unsupported destructive operations return errors.
 * @example const datasets = createLangfuseDatasets(client);
 */
export function createLangfuseDatasets(
  client: LangfuseClient
): DatasetProvider {
  async function all() {
    const datasets: Dataset[] = [];
    let page = 1;
    let totalPages = 1;
    do {
      const response = await client.api.datasets.list({ page, limit: 100 });
      datasets.push(...response.data);
      totalPages = response.meta.totalPages;
      page += 1;
    } while (page <= totalPages);
    return datasets;
  }
  async function byId(id: string) {
    const dataset = (await all()).find((dataset) => dataset.id === id);
    if (!dataset) throw new Error(`Langfuse dataset not found: ${id}`);
    return dataset;
  }
  async function add({ datasetName, items }: AddParams) {
    jsonValue(items);
    for (const item of items)
      await client.api.datasetItems.create({
        datasetName,
        input: jsonValue(item.input),
        expectedOutput: jsonValue(item.expected),
        metadata: jsonValue(item.extra ?? {}),
      });
  }
  async function journal(params: {
    datasetName: string;
    id: string;
    state: 'pending' | 'complete';
  }) {
    await client.api.datasetItems.create({
      datasetName: params.datasetName,
      id: params.id,
      status: 'ARCHIVED',
      input: null,
      expectedOutput: null,
      metadata: {
        [UPLOAD]: { schemaVersion: 1, id: params.id, state: params.state },
      },
    });
  }
  async function upload(params: AddParams & { id: string }) {
    await journal({
      datasetName: params.datasetName,
      id: params.id,
      state: 'pending',
    });
    await add(params);
    await journal({
      datasetName: params.datasetName,
      id: params.id,
      state: 'complete',
    });
  }
  async function activeItems(dataset: Dataset) {
    const items: Awaited<
      ReturnType<LangfuseClient['api']['datasetItems']['list']>
    >['data'] = [];
    let page = 1;
    let totalPages = 1;
    do {
      const response = await client.api.datasetItems.list({
        datasetName: dataset.name,
        page,
        limit: 100,
      });
      items.push(...response.data);
      totalPages = response.meta.totalPages;
      page += 1;
    } while (page <= totalPages);
    const metadata = recordMetadata(dataset.metadata);
    const initial = metadata[INITIAL_UPLOAD];
    if (
      initial !== undefined &&
      (typeof initial !== 'string' ||
        !items.some(
          (item) =>
            item.id === initial && UPLOAD in recordMetadata(item.metadata)
        ))
    )
      throw incomplete(dataset);
    for (const item of items) {
      const metadata = recordMetadata(item.metadata);
      if (!(UPLOAD in metadata)) continue;
      const marker = requireRecord(metadata[UPLOAD]);
      if (
        marker.schemaVersion !== 1 ||
        marker.id !== item.id ||
        marker.state !== 'complete' ||
        item.status !== 'ARCHIVED'
      )
        throw incomplete(dataset);
    }
    return items.filter((item) => item.status === 'ACTIVE');
  }
  async function mapped(dataset: Dataset): Promise<StoredDataset> {
    return {
      id: dataset.id,
      name: dataset.name,
      description: dataset.description ?? undefined,
      version: 1,
      itemCount: (await activeItems(dataset)).length,
      metadata: Object.fromEntries(
        Object.entries(recordMetadata(dataset.metadata)).filter(
          ([key]) => key !== INITIAL_UPLOAD
        )
      ),
      createdAt: new Date(dataset.createdAt),
      updatedAt: new Date(dataset.updatedAt),
    };
  }
  return {
    create: (params) =>
      attemptAsync(async () => {
        if (!params.name.trim())
          throw new Error('Dataset name must not be empty');
        jsonValue(params);
        validateItems(params.items ?? []);
        if (params.metadata && INITIAL_UPLOAD in params.metadata)
          throw new Error(
            `Dataset metadata key ${INITIAL_UPLOAD} is reserved by Viteval`
          );
        const existing = (await all()).find(
          (dataset) => dataset.name === params.name
        );
        if (existing) {
          await mapped(existing);
          throw new Error(`Langfuse dataset already exists: ${params.name}`);
        }
        const uploadId = `viteval-upload-${randomUUID()}`;
        const dataset = await client.api.datasets.create({
          name: params.name,
          description: params.description,
          metadata: jsonValue({
            ...params.metadata,
            [INITIAL_UPLOAD]: uploadId,
          }),
        });
        try {
          await upload({
            datasetName: dataset.name,
            items: params.items ?? [],
            id: uploadId,
          });
        } catch (error) {
          throw new Error(
            `Langfuse dataset ${dataset.id} (${dataset.name}) may be incomplete after upload failure: ${error instanceof Error ? error.message : String(error)}. Inspect and remove the incomplete dataset in Langfuse before retrying creation; dataset existence does not confirm a complete upload.`,
            { cause: error }
          );
        }
        return mapped(dataset);
      }),
    get: (params) =>
      attemptAsync(async () => {
        const dataset = (await all()).find((dataset) =>
          params.id ? dataset.id === params.id : dataset.name === params.name
        );
        return dataset ? mapped(dataset) : null;
      }),
    list: (params) =>
      attemptAsync(async () =>
        Promise.all(
          (await all())
            .slice(
              params?.offset ?? 0,
              params?.limit === undefined
                ? undefined
                : (params.offset ?? 0) + params.limit
            )
            .map(mapped)
        )
      ),
    update: () =>
      Promise.resolve(
        err(
          'The Langfuse SDK does not expose dataset update/rename; manage dataset metadata in Langfuse'
        )
      ),
    delete: () =>
      Promise.resolve(
        err(
          'The Langfuse SDK does not expose dataset deletion; manage datasets in Langfuse'
        )
      ),
    addItems: (params) =>
      attemptAsync(async () => {
        validateItems(params.items);
        const dataset = await byId(params.datasetId);
        await activeItems(dataset);
        await upload({
          datasetName: dataset.name,
          items: params.items,
          id: `viteval-upload-${randomUUID()}`,
        });
      }),
    getItems: (params) =>
      attemptAsync(async () => {
        const dataset = await byId(params.datasetId);
        const items = await activeItems(dataset);
        return items
          .map((item, ordinal) => ({
            id: item.id,
            datasetId: dataset.id,
            ordinal,
            input: item.input,
            expected: item.expectedOutput,
            extra:
              item.metadata === null || item.metadata === undefined
                ? {}
                : requireRecord(item.metadata),
          }))
          .slice(
            params.offset ?? 0,
            params.limit === undefined
              ? undefined
              : (params.offset ?? 0) + params.limit
          );
      }),
    replaceItems: () =>
      Promise.resolve(
        err(
          'Langfuse does not support atomic dataset replacement; create a new dataset instead'
        )
      ),
  };
}

function incomplete(dataset: Dataset): Error {
  return new Error(
    `Langfuse dataset ${dataset.id} (${dataset.name}) has an incomplete Viteval upload. Inspect and remove the incomplete dataset in Langfuse before retrying creation; no cases from it can be reused.`
  );
}

function recordMetadata(value: unknown): Record<string, unknown> {
  return value === null || value === undefined ? {} : requireRecord(value);
}

function validateItems(items: NonNullable<CreateDatasetParams['items']>): void {
  for (const item of items) {
    if (item.extra && UPLOAD in item.extra)
      throw new Error(
        `Dataset item metadata key ${UPLOAD} is reserved by Viteval`
      );
  }
}
