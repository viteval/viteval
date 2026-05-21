import type { DatasetFile, DatasetItem, DatasetSummary } from '@/types';
import type { FsHelper } from '../fs';
import { paginate } from '../paginate';
import type {
  DatasetsResource,
  GetDatasetParams,
  ListDatasetsParams,
  VitevalListResponse,
  VitevalResponse,
} from '../types';

interface RawDataset {
  name?: string;
  description?: string;
  createdAt?: string;
  storage?: string;
  data?: DatasetItem[];
}

async function parseDatasetSummary(
  id: string,
  fsHelper: FsHelper
): Promise<DatasetSummary | null> {
  const raw = await fsHelper.readJson<RawDataset>(`datasets/${id}.json`);
  if (!raw) {
    return null;
  }
  return {
    createdAt: raw.createdAt,
    description: raw.description,
    id,
    itemCount: raw.data ? raw.data.length : 0,
    name: raw.name || id,
    path: fsHelper.relativePath(fsHelper.filePath('datasets', id)),
    source: raw.storage || 'local',
  };
}

export function createDatasetsResource(fsHelper: FsHelper): DatasetsResource {
  return {
    async get(
      params: GetDatasetParams
    ): Promise<VitevalResponse<DatasetFile | null>> {
      const raw = await fsHelper.readJson<Record<string, unknown>>(
        `datasets/${params.id}.json`
      );

      if (!raw) {
        return { data: null };
      }

      const data = {
        ...raw,
        description: raw.description as string | undefined,
        id: params.id,
        name: (raw.name as string) || params.id,
        path: fsHelper.relativePath(fsHelper.filePath('datasets', params.id)),
        source: (raw.storage as string) || 'local',
      } as DatasetFile;

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

      return paginate(items, { limit: params?.limit, page: params?.page });
    },
  };
}
