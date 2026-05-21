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
      const resolved = path.resolve(fsHelper.root, params.id);
      const rel = path.relative(fsHelper.root, resolved);
      if (rel.startsWith('..') || path.isAbsolute(rel)) {
        return { data: null };
      }
      try {
        const content = await fs.readFile(resolved, 'utf8');
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
      return paginate(items, { limit: items.length || 100, page: 1 });
    },
  };
}
