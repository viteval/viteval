import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { attemptAsync, err, type Result } from 'massaman/control';
import { writeJsonAtomic } from '@viteval/internal';
import type { VitevalResponse } from './types';

/**
 * Shared filesystem helpers for SDK resources.
 */
export function createFs(root: string) {
  const resolvedRoot = path.resolve(root);
  const resolvedVitevalDir = path.join(resolvedRoot, '.viteval');

  function vitevalDir(): string {
    return resolvedVitevalDir;
  }

  function resolveWithin(base: string, target: string): string | null {
    const resolved = path.resolve(base, target);
    const rel = path.relative(base, resolved);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      return null;
    }
    return resolved;
  }

  async function listJsonIds(dirPath: string): Promise<string[]> {
    try {
      const fullPath = resolveWithin(resolvedVitevalDir, dirPath);
      if (!fullPath) {
        return [];
      }
      const files = await fs.readdir(fullPath);
      return files
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.slice(0, -5));
    } catch {
      return [];
    }
  }

  async function readJson<T>(filePath: string): Promise<T | null> {
    const fullPath = resolveWithin(resolvedVitevalDir, filePath);
    if (!fullPath) {
      return null;
    }
    try {
      const content = await fs.readFile(fullPath, 'utf8');
      return JSON.parse(content) as T;
    } catch {
      return null;
    }
  }

  async function readJsonFile(
    filePath: string
  ): Promise<VitevalResponse<{ value: unknown } | null>> {
    const fullPath = resolveWithin(resolvedVitevalDir, filePath);
    if (!fullPath) return { error: `Invalid storage path: ${filePath}` };
    try {
      return {
        data: {
          value: JSON.parse(await fs.readFile(fullPath, 'utf8')) as unknown,
        },
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
        return { data: null };
      return {
        error: `Unable to read dataset file ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async function readRawFile(filePath: string): Promise<string | null> {
    const fullPath = resolveWithin(resolvedVitevalDir, filePath);
    if (!fullPath) {
      return null;
    }
    try {
      return await fs.readFile(fullPath, 'utf8');
    } catch {
      return null;
    }
  }

  async function writeJson(
    filePath: string,
    value: unknown
  ): Promise<Result<void>> {
    const fullPath = resolveWithin(resolvedVitevalDir, filePath);
    if (!fullPath) {
      return err(`Refusing to write outside .viteval: ${filePath}`);
    }
    return attemptAsync(async () => {
      await writeJsonAtomic({ filePath: fullPath, value });
    });
  }

  function filePath(dirPath: string, id: string): string {
    return path.join(resolvedVitevalDir, dirPath, `${id}.json`);
  }

  function relativePath(fullPath: string): string {
    return path.relative(resolvedRoot, fullPath);
  }

  return {
    filePath,
    listJsonIds,
    readJson,
    readJsonFile,
    readRawFile,
    relativePath,
    root: resolvedRoot,
    vitevalDir,
    writeJson,
  };
}

export type FsHelper = ReturnType<typeof createFs>;
