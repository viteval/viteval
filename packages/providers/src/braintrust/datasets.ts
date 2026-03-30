import type Braintrust from '@braintrust/api';
import { withResult } from '@viteval/internal';
import type {
  AddDatasetItemsParams,
  CreateDatasetParams,
  DatasetProvider,
  DeleteDatasetParams,
  GetDatasetItemsParams,
  GetDatasetParams,
  ListDatasetsParams,
  StoredDataItem,
  StoredDataset,
  UpdateDatasetParams,
} from '@viteval/core';

/**
 * Create dataset operations backed by Braintrust.
 *
 * @param getClient - Factory returning the Braintrust API client.
 * @param getProjectId - Factory returning the resolved project ID.
 * @returns A DatasetProvider implementation.
 */
export function createBraintrustDatasetOps(
  getClient: () => Promise<Braintrust>,
  getProjectId: () => string
): DatasetProvider {
  return {
    create: (params) =>
      withResult(async () => {
        const client = await getClient();
        const dataset = await client.datasets.create({
          name: params.name,
          project_id: getProjectId(),
          description: params.description,
        });

        if (params.items?.length) {
          await client.datasets.insert(dataset.id, {
            events: params.items.map((item) => ({
              input: item.input,
              expected: item.expected,
              metadata: item.extra,
            })),
          });
        }

        return mapDataset(dataset, params.items?.length ?? 0);
      }),

    get: (params) =>
      withResult(async () => {
        const client = await getClient();

        if (params.id) {
          const dataset = await client.datasets.retrieve(params.id);
          return mapDataset(dataset);
        }

        // Braintrust has no get-by-name, so filter the list
        if (params.name) {
          const page = await client.datasets.list({
            project_id: getProjectId(),
            dataset_name: params.name,
          });

          const datasets: Array<Braintrust.Dataset> = [];
          for await (const d of page) {
            datasets.push(d);
            break; // We only need the first match
          }

          return datasets.length > 0 ? mapDataset(datasets[0]!) : null;
        }

        return null;
      }),

    list: (params) =>
      withResult(async () => {
        const client = await getClient();
        const page = await client.datasets.list({
          project_id: getProjectId(),
          limit: params?.limit,
        });

        const datasets: Array<Braintrust.Dataset> = [];
        let skipped = 0;
        for await (const d of page) {
          if (params?.offset && skipped < params.offset) {
            skipped++;
            continue;
          }
          datasets.push(d);
          if (params?.limit && datasets.length >= params.limit) break;
        }

        return datasets.map((d) => mapDataset(d));
      }),

    update: (params) =>
      withResult(async () => {
        const client = await getClient();
        const dataset = await client.datasets.update(params.id, {
          name: params.name ?? undefined,
          description: params.description,
          metadata: params.metadata,
        });

        return mapDataset(dataset);
      }),

    delete: (params) =>
      withResult(async () => {
        const client = await getClient();
        await client.datasets.delete(params.id);
      }),

    getItems: (params) =>
      withResult(async () => {
        const client = await getClient();
        const response = await client.datasets.fetch(params.datasetId, {
          limit: params.limit,
        });

        let events = response.events;
        if (params.offset) {
          events = events.slice(params.offset);
        }

        return events.map((event, i) => mapDatasetItem(event, params.datasetId, i));
      }),

    addItems: (params) =>
      withResult(async () => {
        const client = await getClient();
        await client.datasets.insert(params.datasetId, {
          events: params.items.map((item) => ({
            input: item.input,
            expected: item.expected,
            metadata: item.extra,
          })),
        });
      }),
  };
}

/*
|------------------
| Internals
|------------------
*/

function mapDataset(
  dataset: Braintrust.Dataset,
  itemCount = 0
): StoredDataset {
  return {
    id: dataset.id,
    name: dataset.name,
    description: dataset.description ?? undefined,
    version: 1, // Braintrust doesn't expose a version counter
    itemCount,
    metadata: dataset.metadata ?? {},
    createdAt: dataset.created ? new Date(dataset.created) : new Date(),
    updatedAt: dataset.created ? new Date(dataset.created) : new Date(),
  };
}

function mapDatasetItem(
  event: Braintrust.DatasetEvent,
  datasetId: string,
  ordinal: number
): StoredDataItem {
  return {
    id: event.id,
    datasetId,
    input: event.input,
    expected: event.expected,
    extra: (event.metadata ?? {}) as Record<string, unknown>,
    ordinal,
  };
}
