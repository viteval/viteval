import { randomUUID } from 'node:crypto';
import type Braintrust from '@braintrust/api';
import { attemptAsync } from 'massaman/control';
import { omit } from 'massaman/object';
import type {
  DatasetProvider,
  StoredDataItem,
  StoredDataset,
} from '@viteval/core';
import { requireRecord } from '#/remote-record';

const STAGING_NAME = '__viteval_upload_';
const INITIAL_UPLOAD = '__viteval_initial_upload';
const UPLOAD = '__viteval_upload';

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
  async function readable(client: Braintrust, dataset: Braintrust.Dataset) {
    if (dataset.name.startsWith(STAGING_NAME)) throw incomplete(dataset.id);
    const events = await fetchItems(client, dataset.id);
    const initial = dataset.metadata?.[INITIAL_UPLOAD];
    if (
      initial !== undefined &&
      (typeof initial !== 'string' ||
        !events.some(
          (event) =>
            event.id === initial && event.metadata && UPLOAD in event.metadata
        ))
    )
      throw incomplete(dataset.id);
    for (const event of events) {
      if (!event.metadata || !(UPLOAD in event.metadata)) continue;
      const marker = requireRecord(event.metadata[UPLOAD]);
      if (
        marker.schemaVersion !== 1 ||
        marker.id !== event.id ||
        marker.state !== 'complete'
      )
        throw incomplete(dataset.id);
    }
    return events.filter(
      (event) => !event.metadata || !(UPLOAD in event.metadata)
    );
  }
  async function mapped(client: Braintrust, dataset: Braintrust.Dataset) {
    const events = await readable(client, dataset);
    return mapDataset(dataset, events.length);
  }
  async function upload(
    client: Braintrust,
    datasetId: string,
    events: Braintrust.DatasetInsertParams['events'],
    id = randomUUID()
  ) {
    const journal = (state: 'pending' | 'complete') =>
      client.datasets.insert(datasetId, {
        events: [
          {
            id,
            input: null,
            expected: null,
            metadata: { [UPLOAD]: { schemaVersion: 1, id, state } },
          },
        ],
      });
    await journal('pending');
    if (events.length) await client.datasets.insert(datasetId, { events });
    await journal('complete');
  }
  return {
    replaceItems: (params) =>
      attemptAsync(async () => {
        const client = await getClient();
        validateItems(params.items);
        const current = await readable(
          client,
          await client.datasets.retrieve(params.datasetId)
        );
        await upload(client, params.datasetId, [
          ...current.map((event) => ({ id: event.id, _object_delete: true })),
          ...params.items.map((item) => ({
            input: item.input,
            expected: item.expected,
            metadata: item.extra,
          })),
        ]);
      }),
    addItems: (params) =>
      attemptAsync(async () => {
        const client = await getClient();
        validateItems(params.items);
        await readable(
          client,
          await client.datasets.retrieve(params.datasetId)
        );
        await upload(
          client,
          params.datasetId,
          params.items.map((item) => ({
            expected: item.expected,
            input: item.input,
            metadata: item.extra,
          }))
        );
      }),

    create: (params) =>
      attemptAsync(async () => {
        const client = await getClient();
        if (!params.name.trim())
          throw new Error('Dataset name must not be empty');
        validateItems(params.items ?? []);
        if (
          params.name.startsWith(STAGING_NAME) ||
          (params.metadata && INITIAL_UPLOAD in params.metadata)
        )
          throw new Error(
            'Dataset name/metadata uses a reserved Viteval upload key'
          );
        for await (const existing of client.datasets.list({
          dataset_name: params.name,
          project_id: getProjectId(),
        })) {
          if (existing.name === params.name) {
            await mapped(client, existing);
            throw new Error(
              `Braintrust dataset already exists: ${params.name}`
            );
          }
        }
        const uploadId = randomUUID();
        const created = await client.datasets.create({
          description: params.description,
          name: `${STAGING_NAME}${uploadId}`,
          project_id: getProjectId(),
        });
        try {
          // @braintrust/api 0.5 supports dataset metadata through PATCH, not its create parameters.
          const dataset = await client.datasets.update(created.id, {
            metadata: { ...params.metadata, [INITIAL_UPLOAD]: uploadId },
          });
          await upload(
            client,
            dataset.id,
            (params.items ?? []).map((item) => ({
              expected: item.expected,
              input: item.input,
              metadata: item.extra,
            })),
            uploadId
          );
          const published = await client.datasets.update(dataset.id, {
            name: params.name,
          });
          return mapDataset(published, params.items?.length ?? 0);
        } catch (error) {
          const cleanup = await attemptAsync(() =>
            client.datasets.delete(created.id)
          );
          if (!cleanup.ok)
            throw new Error(
              `Braintrust dataset ${created.id} creation failed: ${error instanceof Error ? error.message : String(error)}. Cleanup also failed: ${cleanup.error.message}`,
              { cause: error }
            );
          throw error;
        }
      }),

    delete: (params) =>
      attemptAsync(async () => {
        const client = await getClient();
        await client.datasets.delete(params.id);
      }),

    get: (params) =>
      attemptAsync(async () => {
        const client = await getClient();

        if (params.id) {
          const dataset = await client.datasets.retrieve(params.id);
          return mapped(client, dataset);
        }

        // Braintrust has no get-by-name, so filter the list
        if (params.name) {
          const page = await client.datasets.list({
            dataset_name: params.name,
            project_id: getProjectId(),
          });

          for await (const d of page) {
            if (d.name === params.name) return mapped(client, d);
          }
          return null;
        }

        return null;
      }),

    getItems: (params) =>
      attemptAsync(async () => {
        const client = await getClient();
        let events = await readable(
          client,
          await client.datasets.retrieve(params.datasetId)
        );
        if (params.offset) {
          events = events.slice(params.offset);
        }
        if (params.limit !== undefined) {
          events = events.slice(0, params.limit);
        }

        return events.map((event, i) =>
          mapDatasetItem(event, params.datasetId, (params.offset ?? 0) + i)
        );
      }),

    list: (params) =>
      attemptAsync(async () => {
        const client = await getClient();
        const fetchLimit = params?.limit
          ? params?.offset
            ? params.offset + params.limit
            : params.limit
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

        return Promise.all(datasets.map((d) => mapped(client, d)));
      }),

    update: (params) =>
      attemptAsync(async () => {
        const client = await getClient();
        if (
          params.name?.startsWith(STAGING_NAME) ||
          (params.metadata && INITIAL_UPLOAD in params.metadata)
        )
          throw new Error(
            'Dataset name/metadata uses a reserved Viteval upload key'
          );
        const current = await client.datasets.retrieve(params.id);
        await readable(client, current);
        const dataset = await client.datasets.update(params.id, {
          description: params.description,
          metadata:
            params.metadata === undefined
              ? undefined
              : {
                  ...params.metadata,
                  ...(current.metadata && INITIAL_UPLOAD in current.metadata
                    ? { [INITIAL_UPLOAD]: current.metadata[INITIAL_UPLOAD] }
                    : {}),
                },
          name: params.name ?? undefined,
        });

        return mapped(client, dataset);
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
  itemCount: number
): StoredDataset {
  return {
    id: dataset.id,
    name: dataset.name,
    description: dataset.description ?? undefined,
    version: 1, // Braintrust doesn't expose a version counter
    itemCount,
    metadata: omit(dataset.metadata ?? {}, [INITIAL_UPLOAD]),
    createdAt: dataset.created ? new Date(dataset.created) : new Date(),
    updatedAt: dataset.created ? new Date(dataset.created) : new Date(),
  };
}

async function fetchItems(
  client: Braintrust,
  datasetId: string
): Promise<Braintrust.DatasetEvent[]> {
  const events: Braintrust.DatasetEvent[] = [];
  let cursor: string | undefined;
  const seen = new Set<string>();
  do {
    const page = await client.datasets.fetchPost(datasetId, {
      cursor,
    });
    const ids = new Set(events.map((event) => event.id));
    events.push(...page.events.filter((event) => !ids.has(event.id)));
    cursor = page.cursor ?? undefined;
    if (cursor && seen.has(cursor))
      throw new Error('Braintrust returned a repeated dataset cursor');
    if (cursor) seen.add(cursor);
  } while (cursor);
  return events;
}

function incomplete(id: string): Error {
  return new Error(
    `Braintrust dataset ${id} has an incomplete Viteval upload. Delete the incomplete dataset or restore it in Braintrust before retrying; no cases from it can be reused.`
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
