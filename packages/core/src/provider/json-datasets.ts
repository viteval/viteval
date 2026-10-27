import { randomUUID } from 'node:crypto';
import { attemptAsync } from 'massaman/control';
import type { z } from 'zod';
import { DATASET_FILE_SCHEMA } from '#/dataset/file';
import type { JsonStore } from './json-store';
import type { DatasetProvider, StoredDataset } from './types';

const STORAGE_DATASET_SCHEMA = DATASET_FILE_SCHEMA.required({
  schemaVersion: true,
  id: true,
  name: true,
  version: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
});
type StorageDataset = z.infer<typeof STORAGE_DATASET_SCHEMA>;

/**
 * Create dataset operations over JSON storage.
 * @param store - Project storage.
 * @returns Dataset provider operations.
 * @example const datasets = createJsonDatasets(store);
 */
export function createJsonDatasets(store: JsonStore): DatasetProvider {
  const file = (id: string) => `datasets/${encodeURIComponent(id)}.json`;
  async function list() {
    const files = await store.list('datasets');
    return Promise.all(
      files.map(async (name) => {
        const record = await store.read(
          `datasets/${name}`,
          STORAGE_DATASET_SCHEMA
        );
        if (!record) throw new Error(`Dataset disappeared: ${name}`);
        return {
          id: record.id,
          record,
        };
      })
    );
  }
  return {
    create: (params) =>
      attemptAsync(() =>
        store.update('datasets', async () => {
          if (!params.name.trim())
            throw new Error('Dataset name must not be empty');
          const datasets = await list();
          if (datasets.some(({ record }) => record.name === params.name))
            throw new Error(`Dataset already exists: ${params.name}`);
          const id = datasets.some((dataset) => dataset.id === params.name)
            ? `${params.name}-${randomUUID()}`
            : params.name;
          const now = new Date().toISOString();
          const record: StorageDataset = {
            schemaVersion: 1,
            id,
            name: params.name,
            description: params.description,
            version: 1,
            metadata: params.metadata ?? {},
            createdAt: now,
            updatedAt: now,
            data: (params.items ?? []).map(({ input, expected, extra }) => ({
              ...extra,
              input: input ?? null,
              expected: expected ?? null,
            })),
          };
          return store.update(file(id), async () => {
            await store.write(file(id), record);
            return toDataset(id, record);
          });
        })
      ),
    get: (params) =>
      attemptAsync(async () => {
        const found =
          params.id !== undefined
            ? (await list()).find((dataset) => dataset.id === params.id)
            : (await list()).find(({ record }) => record.name === params.name);
        return found?.record ? toDataset(found.id, found.record) : null;
      }),
    list: (params) =>
      attemptAsync(async () =>
        (await list())
          .slice(
            params?.offset ?? 0,
            params?.limit === undefined
              ? undefined
              : (params.offset ?? 0) + params.limit
          )
          .map(({ id, record }) => toDataset(id, record))
      ),
    update: (params) =>
      attemptAsync(() =>
        store.update('datasets', async () =>
          store.update(file(params.id), async () => {
            if (params.name !== undefined && !params.name.trim())
              throw new Error('Dataset name must not be empty');
            const current = await store.read(
              file(params.id),
              STORAGE_DATASET_SCHEMA
            );
            if (!current) throw new Error(`Dataset not found: ${params.id}`);
            if (
              params.name &&
              (await list()).some(
                ({ id, record }) =>
                  id !== params.id && record.name === params.name
              )
            )
              throw new Error(`Dataset already exists: ${params.name}`);
            const next = {
              ...current,
              name: params.name ?? current.name,
              description: params.description ?? current.description,
              metadata: params.metadata ?? current.metadata,
              updatedAt: new Date().toISOString(),
              version: current.version + 1,
            };
            await store.write(file(params.id), next);
            return toDataset(params.id, next);
          })
        )
      ),
    delete: (params) =>
      attemptAsync(async () =>
        store.update(file(params.id), async () => store.remove(file(params.id)))
      ),
    getItems: (params) =>
      attemptAsync(async () => {
        const record = await store.read(
          file(params.datasetId),
          STORAGE_DATASET_SCHEMA
        );
        if (!record) throw new Error(`Dataset not found: ${params.datasetId}`);
        return record.data
          .map(({ input, expected, ...extra }, ordinal) => ({
            id: `${params.datasetId}:${ordinal}`,
            datasetId: params.datasetId,
            input,
            expected,
            extra,
            ordinal,
          }))
          .slice(
            params.offset ?? 0,
            params.limit === undefined
              ? undefined
              : (params.offset ?? 0) + params.limit
          );
      }),
    replaceItems: (params) =>
      attemptAsync(async () =>
        store.update(file(params.datasetId), async () => {
          const current = await store.read(
            file(params.datasetId),
            STORAGE_DATASET_SCHEMA
          );
          if (!current)
            throw new Error(`Dataset not found: ${params.datasetId}`);
          await store.write(file(params.datasetId), {
            ...current,
            data: params.items.map(({ input, expected, extra }) => ({
              ...extra,
              input: input ?? null,
              expected: expected ?? null,
            })),
            updatedAt: new Date().toISOString(),
            version: current.version + 1,
          });
        })
      ),
    addItems: (params) =>
      attemptAsync(async () =>
        store.update(file(params.datasetId), async () => {
          const current = await store.read(
            file(params.datasetId),
            STORAGE_DATASET_SCHEMA
          );
          if (!current)
            throw new Error(`Dataset not found: ${params.datasetId}`);
          await store.write(file(params.datasetId), {
            ...current,
            data: [
              ...current.data,
              ...params.items.map(({ input, expected, extra }) => ({
                ...extra,
                input: input ?? null,
                expected: expected ?? null,
              })),
            ],
            updatedAt: new Date().toISOString(),
            version: current.version + 1,
          });
        })
      ),
  };
}

function toDataset(id: string, record: StorageDataset): StoredDataset {
  return {
    id,
    name: record.name,
    description: record.description,
    version: record.version,
    itemCount: record.data.length,
    metadata: record.metadata,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  };
}
