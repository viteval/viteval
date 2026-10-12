import type { DatasetFile, DatasetSummary } from '@/types';
import { DATASET_FILE_SCHEMA } from '@viteval/core/dataset';
import type { FsHelper } from '../fs';
import { paginate } from '../paginate';
import { sortItems } from '../sort';
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
      let response = await fsHelper.readJsonFile(`datasets/${filename}.json`);
      if ('error' in response) return response;
      if (response.data === null && filename !== params.id) {
        filename = params.id;
        response = await fsHelper.readJsonFile(`datasets/${filename}.json`);
      }
      if ('error' in response) return response;
      if (response.data === null) {
        return { data: null };
      }
      const parsed = DATASET_FILE_SCHEMA.safeParse(response.data.value);
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

      const query = params?.q?.toLowerCase();
      const filtered = parsed
        .filter((d): d is DatasetSummary => d !== null)
        .filter(
          (d) =>
            !query ||
            d.name.toLowerCase().includes(query) ||
            Boolean(d.description?.toLowerCase().includes(query))
        );
      const items = sortItems({
        items: filtered,
        sort: params?.sort,
        order:
          params?.order ?? (params?.sort === 'recent' ? 'desc' : undefined),
        defaultSort: 'name',
        fields: {
          name: (d) => d.name,
          itemCount: (d) => d.itemCount,
          source: (d) => d.source,
          createdAt: (d) => (d.createdAt ? Date.parse(d.createdAt) : 0),
          recent: (d) => (d.createdAt ? Date.parse(d.createdAt) : 0),
        },
      });

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
