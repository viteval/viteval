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
  async function activeItems(params: { datasetName: string; stopAt?: number }) {
    const items: Awaited<
      ReturnType<LangfuseClient['api']['datasetItems']['list']>
    >['data'] = [];
    let page = 1;
    let totalPages = 1;
    do {
      const response = await client.api.datasetItems.list({
        datasetName: params.datasetName,
        page,
        limit: 100,
      });
      items.push(...response.data.filter((item) => item.status === 'ACTIVE'));
      totalPages = response.meta.totalPages;
      page += 1;
    } while (
      page <= totalPages &&
      (params.stopAt === undefined || items.length < params.stopAt)
    );
    return items;
  }
  async function mapped(dataset: Dataset): Promise<StoredDataset> {
    return {
      id: dataset.id,
      name: dataset.name,
      description: dataset.description ?? undefined,
      version: 1,
      itemCount: (await activeItems({ datasetName: dataset.name })).length,
      metadata:
        dataset.metadata === null || dataset.metadata === undefined
          ? {}
          : requireRecord(dataset.metadata),
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
        const dataset = await client.api.datasets.create({
          name: params.name,
          description: params.description,
          metadata: jsonValue(params.metadata ?? {}),
        });
        await add({ datasetName: dataset.name, items: params.items ?? [] });
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
      attemptAsync(async () =>
        add({
          datasetName: (await byId(params.datasetId)).name,
          items: params.items,
        })
      ),
    getItems: (params) =>
      attemptAsync(async () => {
        const dataset = await byId(params.datasetId);
        if (params.limit === 0) return [];
        const items = await activeItems({
          datasetName: dataset.name,
          stopAt:
            params.limit === undefined
              ? undefined
              : (params.offset ?? 0) + params.limit,
        });
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
