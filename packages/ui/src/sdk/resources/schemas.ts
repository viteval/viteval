import * as fs from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import * as path from 'node:path';
import type { EvalSchema } from '@/types';
import type { FsHelper } from '../fs';
import { paginate } from '../paginate';
import type {
  GetSchemaParams,
  SchemasResource,
  VitevalListResponse,
  VitevalResponse,
} from '../types';

export function createSchemasResource(fsHelper: FsHelper): SchemasResource {
  async function loadAll(): Promise<EvalSchema[]> {
    try {
      const patterns = ['src/**/*.eval.ts', 'src/**/*.eval.js'];
      const schemas: EvalSchema[] = [];

      for (const pattern of patterns) {
        const matches = glob(pattern, { cwd: fsHelper.root });
        for await (const match of matches) {
          const filePath = path.join(fsHelper.root, match);
          const relativePath = path.relative(fsHelper.root, filePath);
          schemas.push({
            content: '',
            id: relativePath,
            name: path.basename(relativePath),
            path: relativePath,
          });
        }
      }

      return schemas.toSorted((a, b) => a.name.localeCompare(b.name));
    } catch {
      return [];
    }
  }

  return {
    async get(
      params: GetSchemaParams
    ): Promise<VitevalResponse<EvalSchema | null>> {
      try {
        const filePath = path.join(fsHelper.root, params.id);
        const normalizedPath = path.normalize(filePath);
        if (!normalizedPath.startsWith(fsHelper.root)) {
          return { data: null };
        }
        const content = await fs.readFile(normalizedPath, 'utf8');
        return {
          data: {
            content,
            id: params.id,
            name: path.basename(params.id),
            path: params.id,
          },
        };
      } catch {
        return { data: null };
      }
    },

    async list(): Promise<VitevalListResponse<EvalSchema>> {
      const items = await loadAll();
      return paginate(items, 1, items.length || 100);
    },
  };
}
