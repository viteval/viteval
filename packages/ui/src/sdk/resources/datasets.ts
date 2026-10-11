import type { DatasetFile, DatasetSummary } from '@/types';
import { DATASET_FILE_SCHEMA } from '@viteval/core/dataset';
import type { FsHelper } from '../fs';
import { paginate } from '../paginate';
import type {
  DatasetsResource,
  GetDatasetParams,
  ListDatasetsParams,
  VitevalListResponse,
  VitevalResponse,
} from '../types';

async function parseDatasetSummary(
  id: string,
  fsHelper: FsHelper
): Promise<DatasetSummary | null> {
  const value = await fsHelper.readJson<unknown>(`datasets/${id}.json`);
  const parsed = DATASET_FILE_SCHEMA.safeParse(value);
  if (!parsed.success) {
    return null;
  }
  const raw = parsed.data;
  return {
    createdAt: raw.createdAt ?? raw.timestamp,
    description: raw.description,
    id: raw.id ?? id,
    itemCount: raw.data ? raw.data.length : 0,
    name: raw.name || id,
    path: fsHelper.relativePath(fsHelper.filePath('datasets', id)),
    source: 'json',
  };
}

export function createDatasetsResource(fsHelper: FsHelper): DatasetsResource {
  return {
    async get(
      params: GetDatasetParams
    ): Promise<VitevalResponse<DatasetFile | null>> {
      let filename = encodeURIComponent(params.id);
      let value = await fsHelper.readJson<unknown>(`datasets/${filename}.json`);
      if (value === null && filename !== params.id) {
        filename = params.id;
        value = await fsHelper.readJson<unknown>(`datasets/${filename}.json`);
      }

      if (value === null) {
        return { data: null };
      }
      const parsed = DATASET_FILE_SCHEMA.safeParse(value);
      if (!parsed.success)
        return { error: `Invalid dataset file: ${params.id}` };
      const raw = parsed.data;
      const id = raw.id ?? params.id;

      const data = {
        ...raw,
        description: raw.description,
        id,
        name: raw.name || params.id,
        path: fsHelper.relativePath(fsHelper.filePath('datasets', filename)),
        source: 'json',
        data: raw.data.map((item, index) => ({
          ...item,
          id: typeof item.id === 'string' ? item.id : `${id}:${index}`,
          metadata: itemMetadata(item),
        })),
      } satisfies DatasetFile;

      return { data };
    },

    async list(
      params?: ListDatasetsParams
    ): Promise<VitevalListResponse<DatasetSummary>> {
      const ids = await fsHelper.listJsonIds('datasets');

      const parsed = await Promise.all(
        ids.map((id) => parseDatasetSummary(id, fsHelper))
      );

      const filtered = parsed.filter((d): d is DatasetSummary => d !== null);
      const items =
        params?.sort === 'recent'
          ? filtered.toSorted((a, b) => {
              const aTs = a.createdAt ? Date.parse(a.createdAt) : 0;
              const bTs = b.createdAt ? Date.parse(b.createdAt) : 0;
              return bTs - aTs;
            })
          : filtered.toSorted((a, b) => a.name.localeCompare(b.name));

      return {
        ...paginate(items, { limit: params?.limit, page: params?.page }),
        warnings: ids
          .filter((_id, index) => parsed[index] === null)
          .map((id) => `Invalid dataset file: ${id}.json`),
      };
    },
  };
}

function itemMetadata(item: Record<string, unknown>): Record<string, unknown> {
  const {
    id: _id,
    name: _name,
    input: _input,
    expected: _expected,
    metadata,
    ...extra
  } = item;
  if (
    typeof metadata === 'object' &&
    metadata !== null &&
    !Array.isArray(metadata)
  ) {
    return { ...extra, ...metadata };
  }
  return metadata === undefined ? extra : { ...extra, metadata };
}
