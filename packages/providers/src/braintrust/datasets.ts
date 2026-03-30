import type Braintrust from '@braintrust/api';
import { withResult } from '@viteval/internal';
import type {
  DatasetProvider,
  StoredDataItem,
  StoredDataset,
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
    addItems: (params) =>
      withResult(async () => {
        const client = await getClient();
        await client.datasets.insert(params.datasetId, {
          events: params.items.map((item) => ({
            expected: item.expected,
            input: item.input,
            metadata: item.extra,
          })),
        });
      }),

    create: (params) =>
      withResult(async () => {
        const client = await getClient();
        const dataset = await client.datasets.create({
          description: params.description,
          name: params.name,
          project_id: getProjectId(),
        });

        if (params.items?.length) {
          await client.datasets.insert(dataset.id, {
            events: params.items.map((item) => ({
              expected: item.expected,
              input: item.input,
              metadata: item.extra,
            })),
          });
        }

        return mapDataset(dataset, params.items?.length ?? 0);
      }),

    delete: (params) =>
      withResult(async () => {
        const client = await getClient();
        await client.datasets.delete(params.id);
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
            dataset_name: params.name,
            project_id: getProjectId(),
          });

          const datasets: Braintrust.Dataset[] = [];
          for await (const d of page) {
            datasets.push(d);
            break; // We only need the first match
          }

          return datasets.length > 0 ? mapDataset(datasets[0]!) : null;
        }

        return null;
      }),

    getItems: (params) =>
      withResult(async () => {
        const client = await getClient();
        const fetchLimit = params.limit
          ? (params.offset
            ? params.offset + params.limit
            : params.limit)
          : undefined;
        const response = await client.datasets.fetch(params.datasetId, {
          limit: fetchLimit,
        });

        let { events } = response;
        if (params.offset) {
          events = events.slice(params.offset);
        }
        if (params.limit) {
          events = events.slice(0, params.limit);
        }

        return events.map((event, i) =>
          mapDatasetItem(event, params.datasetId, (params.offset ?? 0) + i)
        );
      }),

    list: (params) =>
      withResult(async () => {
        const client = await getClient();
        const fetchLimit = params?.limit
          ? (params?.offset
            ? params.offset + params.limit
            : params.limit)
          : undefined;
        const page = await client.datasets.list({
          limit: fetchLimit,
          project_id: getProjectId(),
        });

        const datasets: Braintrust.Dataset[] = [];
        let skipped = 0;
        for await (const d of page) {
          if (params?.offset && skipped < params.offset) {
            skipped++;
            continue;
          }
          datasets.push(d);
          if (params?.limit && datasets.length >= params.limit) {
            break;
          }
        }

        return datasets.map((d) => mapDataset(d));
      }),

    update: (params) =>
      withResult(async () => {
        const client = await getClient();
        const dataset = await client.datasets.update(params.id, {
          description: params.description,
          metadata: params.metadata,
          name: params.name ?? undefined,
        });

        return mapDataset(dataset);
      }),
  };
}

/*
|------------------
| Internals
|------------------
*/

function mapDataset(dataset: Braintrust.Dataset, itemCount = 0): StoredDataset {
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
    datasetId,
    expected: event.expected,
    extra: (event.metadata ?? {}) as Record<string, unknown>,
    id: event.id,
    input: event.input,
    ordinal,
  };
}
