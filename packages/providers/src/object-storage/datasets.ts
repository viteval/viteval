import { createHash, randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { attemptAsync } from 'massaman/control';
import { isFiniteNumber } from 'massaman/predicate';
import type {
  CreateDatasetParams,
  DatasetProvider,
  Provider,
  StoredDataset,
} from '@viteval/core';
import { DATASET_FILE_SCHEMA } from '@viteval/core/dataset';
import { serializeJson } from '@viteval/internal';
import { jsonValue, requireRecord } from '#/remote-record';

/**
 * Immutable snapshot storage retains superseded and unreferenced objects.
 * Dataset deletion removes its catalog entry, not its historical payloads.
 * Bucket cleanup is caller-managed and must protect snapshots used by readers.
 */
export interface ObjectDatasetOptions {
  /** Namespace in the bucket. Defaults to viteval/datasets. */
  prefix?: string;
  /** Maximum attempts to commit a catalog update after conditional-write conflicts. Defaults to 16. */
  maxAttempts?: number;
}
export interface ConditionalObjectStore {
  read(key: string): Promise<{ body: string; version: string } | null>;
  /** Null requires absence; a version requires an exact match. False means a precondition conflict. */
  write(params: {
    key: string;
    body: string;
    version: string | null;
  }): Promise<boolean>;
  close(): Promise<void>;
}
interface ObjectProviderParams extends ObjectDatasetOptions {
  name: string;
  connect(): Promise<ConditionalObjectStore>;
}
interface Descriptor extends StoredDataset {
  key: string;
  digest: string;
}
interface Item {
  input: unknown;
  expected: unknown;
  extra: Record<string, unknown>;
}
interface CatalogSnapshot {
  datasets: Descriptor[];
  version: string | null;
}
interface PublishParams {
  descriptor: StoredDataset;
  items: Item[];
}
type DatasetFile = ReturnType<typeof DATASET_FILE_SCHEMA.parse>;

/** Create a dataset-only provider over conditional object writes.
 * @param params - Lazy transport, namespace, and conflict budget.
 * @returns A provider whose catalog publishes immutable versions atomically.
 * @example const provider = createObjectDatasetProvider({ name: 's3', connect });
 */
export function createObjectDatasetProvider(
  params: ObjectProviderParams
): Provider {
  let store: ConditionalObjectStore | undefined;
  let datasets: DatasetProvider | undefined;
  return {
    name: params.name,
    get datasets() {
      return datasets;
    },
    initialize: () =>
      attemptAsync(async () => {
        if (store) return;
        const maxAttempts = params.maxAttempts ?? 16;
        if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1)
          throw new Error('maxAttempts must be a positive integer');
        const prefix = (params.prefix ?? 'viteval/datasets').replace(
          /^\/+|\/+$/g,
          ''
        );
        const connected = await params.connect();
        store = connected;
        datasets = createOperations({ store: connected, prefix, maxAttempts });
      }),
    close: () =>
      attemptAsync(async () => {
        await store?.close();
        store = undefined;
        datasets = undefined;
      }),
  };
}

function createOperations({
  store,
  prefix,
  maxAttempts,
}: {
  store: ConditionalObjectStore;
  prefix: string;
  maxAttempts: number;
}): DatasetProvider {
  const key = (relative: string) =>
    prefix ? `${prefix}/${relative}` : relative;
  async function catalog(): Promise<CatalogSnapshot> {
    const object = await store.read(key('index.json'));
    if (!object) return { datasets: [], version: null };
    return { datasets: decodeCatalog(object.body), version: object.version };
  }
  async function readItems(descriptor: Descriptor): Promise<Item[]> {
    const object = await store.read(key(descriptor.key));
    if (!object)
      throw new Error(`Dataset version is missing: ${descriptor.key}`);
    if (
      createHash('sha256').update(object.body).digest('hex') !==
      descriptor.digest
    )
      throw new Error(`Dataset version content changed: ${descriptor.id}`);
    const file = DATASET_FILE_SCHEMA.parse(JSON.parse(object.body));
    if (
      file.schemaVersion !== 1 ||
      file.id !== descriptor.id ||
      file.version !== descriptor.version ||
      file.name !== descriptor.name ||
      file.data.length !== descriptor.itemCount
    ) {
      throw new Error(
        `Dataset version does not match its catalog: ${descriptor.id}`
      );
    }
    return file.data.map(({ input, expected, ...extra }) => ({
      input,
      expected,
      extra,
    }));
  }
  async function publish(params: PublishParams): Promise<Descriptor> {
    const relative = `versions/${randomUUID()}.json`;
    const file: DatasetFile = {
      schemaVersion: 1,
      id: params.descriptor.id,
      name: params.descriptor.name,
      version: params.descriptor.version,
      description: params.descriptor.description,
      metadata: params.descriptor.metadata,
      createdAt: params.descriptor.createdAt.toISOString(),
      updatedAt: params.descriptor.updatedAt.toISOString(),
      data: params.items.map(({ input, expected, extra }) => ({
        ...extra,
        input,
        expected,
      })),
    };
    const body = serializeJson(file);
    const written = await store.write({
      key: key(relative),
      body,
      version: null,
    });
    if (!written)
      throw new Error('Immutable dataset version key unexpectedly exists');
    return {
      ...params.descriptor,
      key: relative,
      digest: createHash('sha256').update(body).digest('hex'),
      itemCount: params.items.length,
    };
  }
  async function commit<T>(
    operation: (
      datasets: Descriptor[]
    ) => Promise<{ datasets: Descriptor[]; value: T }>
  ): Promise<T> {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const current = await catalog();
      const next = await operation(current.datasets);
      const committed = await store.write({
        key: key('index.json'),
        body: serializeJson({ schemaVersion: 1, datasets: next.datasets }),
        version: current.version,
      });
      if (committed) return next.value;
      if (attempt + 1 < maxAttempts)
        await setTimeout(Math.min(2 ** attempt, 50));
    }
    throw new Error(
      `Dataset catalog conflict budget exhausted after ${maxAttempts} attempts`
    );
  }
  async function modify(params: {
    id: string;
    transform(descriptor: Descriptor, items: Item[]): PublishParams;
  }) {
    return commit(async (datasets) => {
      const current = findDescriptor({ datasets, id: params.id });
      const transformed = params.transform(current, await readItems(current));
      if (
        datasets.some(
          (dataset) =>
            dataset.id !== current.id &&
            dataset.name === transformed.descriptor.name
        )
      )
        throw new Error(
          `Dataset already exists: ${transformed.descriptor.name}`
        );
      const next = await publish({
        ...transformed,
        descriptor: {
          ...transformed.descriptor,
          version: current.version + 1,
          updatedAt: new Date(),
        },
      });
      return {
        datasets: datasets.map((dataset) =>
          dataset.id === next.id ? next : dataset
        ),
        value: asDataset(next),
      };
    });
  }
  return {
    create: (params) =>
      attemptAsync(async () => {
        requireName(params.name);
        jsonValue(params);
        const items = normalizeItems(params.items);
        const id = randomUUID();
        return commit(async (datasets) => {
          if (datasets.some((dataset) => dataset.name === params.name))
            throw new Error(`Dataset already exists: ${params.name}`);
          const now = new Date();
          const next = await publish({
            descriptor: {
              id,
              name: params.name,
              description: params.description,
              version: 1,
              itemCount: items.length,
              metadata:
                params.metadata === undefined
                  ? {}
                  : requireRecord(jsonValue(params.metadata)),
              createdAt: now,
              updatedAt: now,
            },
            items,
          });
          return { datasets: [...datasets, next], value: asDataset(next) };
        });
      }),
    get: (params) =>
      attemptAsync(async () => {
        const found = (await catalog()).datasets.find((dataset) =>
          params.id !== undefined
            ? dataset.id === params.id
            : dataset.name === params.name
        );
        return found ? asDataset(found) : null;
      }),
    list: (params) =>
      attemptAsync(async () =>
        (await catalog()).datasets
          .toSorted((a, b) => a.name.localeCompare(b.name))
          .slice(
            params?.offset ?? 0,
            params?.limit === undefined
              ? undefined
              : (params.offset ?? 0) + params.limit
          )
          .map(asDataset)
      ),
    update: (params) =>
      attemptAsync(async () => {
        if (params.name !== undefined) requireName(params.name);
        jsonValue(params);
        return modify({
          id: params.id,
          transform: (descriptor, items) => ({
            descriptor: {
              ...descriptor,
              name: params.name ?? descriptor.name,
              description: params.description ?? descriptor.description,
              metadata:
                params.metadata === undefined
                  ? descriptor.metadata
                  : requireRecord(jsonValue(params.metadata)),
            },
            items,
          }),
        });
      }),
    delete: (params) =>
      attemptAsync(async () => {
        await commit(async (datasets) => ({
          datasets: datasets.filter((dataset) => dataset.id !== params.id),
          value: undefined,
        }));
      }),
    getItems: (params) =>
      attemptAsync(async () => {
        const descriptor = findDescriptor({
          datasets: (await catalog()).datasets,
          id: params.datasetId,
        });
        return (await readItems(descriptor))
          .map((item, ordinal) => ({
            ...item,
            id: `${descriptor.id}:${ordinal}`,
            datasetId: descriptor.id,
            ordinal,
          }))
          .slice(
            params.offset ?? 0,
            params.limit === undefined
              ? undefined
              : (params.offset ?? 0) + params.limit
          );
      }),
    addItems: (params) =>
      attemptAsync(async () => {
        const added = normalizeItems(params.items);
        await modify({
          id: params.datasetId,
          transform: (descriptor, items) => ({
            descriptor,
            items: [...items, ...added],
          }),
        });
      }),
    replaceItems: (params) =>
      attemptAsync(async () => {
        const replacement = normalizeItems(params.items);
        await modify({
          id: params.datasetId,
          transform: (descriptor) => ({ descriptor, items: replacement }),
        });
      }),
  };
}

function decodeCatalog(body: string): Descriptor[] {
  const catalog = requireRecord(JSON.parse(body));
  if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.datasets))
    throw new Error('Invalid dataset catalog schema');
  const datasets = catalog.datasets.map((value) => {
    const data = requireRecord(value);
    if (
      typeof data.id !== 'string' ||
      typeof data.name !== 'string' ||
      !data.name.trim() ||
      typeof data.version !== 'number' ||
      !Number.isSafeInteger(data.version) ||
      data.version < 1 ||
      typeof data.itemCount !== 'number' ||
      !Number.isSafeInteger(data.itemCount) ||
      data.itemCount < 0 ||
      typeof data.key !== 'string' ||
      !/^versions\/[\da-f-]+\.json$/.test(data.key) ||
      typeof data.digest !== 'string' ||
      !/^[\da-f]{64}$/.test(data.digest) ||
      (data.description !== undefined && typeof data.description !== 'string')
    )
      throw new Error('Invalid dataset catalog entry');
    return {
      id: data.id,
      name: data.name,
      version: data.version,
      itemCount: data.itemCount,
      key: data.key,
      digest: data.digest,
      description: data.description,
      metadata: requireRecord(data.metadata),
      createdAt: date(data.createdAt),
      updatedAt: date(data.updatedAt),
    };
  });
  if (
    new Set(datasets.map((dataset) => dataset.id)).size !== datasets.length ||
    new Set(datasets.map((dataset) => dataset.name)).size !== datasets.length
  )
    throw new Error('Dataset catalog contains duplicate IDs or names');
  return datasets;
}
function normalizeItems(items: CreateDatasetParams['items']): Item[] {
  const parsed = jsonValue(items ?? []);
  if (!Array.isArray(parsed)) throw new Error('Dataset items must be an array');
  return parsed.map((value) => {
    const item = requireRecord(value);
    return {
      input: item.input ?? null,
      expected: item.expected ?? null,
      extra: item.extra === undefined ? {} : requireRecord(item.extra),
    };
  });
}
function date(value: unknown): Date {
  if (typeof value !== 'string' || !isFiniteNumber(Date.parse(value)))
    throw new Error('Invalid dataset catalog timestamp');
  return new Date(value);
}
function requireName(name: string) {
  if (typeof name !== 'string' || !name.trim())
    throw new Error('Dataset name must not be empty');
}
function findDescriptor(params: {
  datasets: Descriptor[];
  id: string;
}): Descriptor {
  const descriptor = params.datasets.find(
    (dataset) => dataset.id === params.id
  );
  if (!descriptor) throw new Error(`Dataset not found: ${params.id}`);
  return descriptor;
}
function asDataset(descriptor: Descriptor): StoredDataset {
  const { key: _key, digest: _digest, ...dataset } = descriptor;
  return dataset;
}
