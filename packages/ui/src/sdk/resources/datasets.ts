import * as fs from 'node:fs/promises';
import type { DatasetFile, DatasetSummary } from '@/types';
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
  filePath: string,
  fileName: string,
  fsHelper: FsHelper
): Promise<DatasetSummary | null> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    const id = fileName.replace('.json', '');

    return {
      createdAt: data.createdAt,
      description: data.description,
      id,
      itemCount: data.data ? data.data.length : 0,
      name: data.name || id,
      path: fsHelper.relativePath(filePath),
      source: data.storage || 'local',
    };
  } catch {
    return null;
  }
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
        path: fsHelper.relativePath(
          fsHelper.filePath('datasets', params.id)
        ),
        source: (raw.storage as string) || 'local',
      } as DatasetFile;

      return { data };
    },

    async list(
      params?: ListDatasetsParams
    ): Promise<VitevalListResponse<DatasetSummary>> {
      const ids = await fsHelper.listJsonIds('datasets');

      const parsed = await Promise.all(
        ids.map((id) =>
          parseDatasetSummary(
            fsHelper.filePath('datasets', id),
            `${id}.json`,
            fsHelper
          )
        )
      );

      const items = parsed
        .filter((d): d is DatasetSummary => d !== null)
        .toSorted((a, b) => a.name.localeCompare(b.name));

      return paginate(items, params?.page, params?.limit);
    },
  };
}
