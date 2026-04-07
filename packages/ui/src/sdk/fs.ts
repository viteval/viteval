import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Shared filesystem helpers for SDK resources.
 */
export function createFs(root: string) {
  function vitevalDir(): string {
    return path.join(root, '.viteval');
  }

  async function listJsonIds(dirPath: string): Promise<string[]> {
    try {
      const fullPath = path.join(vitevalDir(), dirPath);
      const files = await fs.readdir(fullPath);
      return files
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.replace('.json', ''));
    } catch {
      return [];
    }
  }

  async function readJson<T>(filePath: string): Promise<T | null> {
    try {
      const fullPath = path.join(vitevalDir(), filePath);
      const normalizedPath = path.normalize(fullPath);
      if (!normalizedPath.startsWith(vitevalDir())) {
        return null;
      }
      const content = await fs.readFile(normalizedPath, 'utf8');
      return JSON.parse(content) as T;
    } catch {
      return null;
    }
  }

  async function readRawFile(filePath: string): Promise<string | null> {
    try {
      const fullPath = path.join(vitevalDir(), filePath);
      const content = await fs.readFile(fullPath, 'utf8');
      return content;
    } catch {
      return null;
    }
  }

  function filePath(dirPath: string, id: string): string {
    return path.join(vitevalDir(), dirPath, `${id}.json`);
  }

  function relativePath(fullPath: string): string {
    return path.relative(root, fullPath);
  }

  return {
    filePath,
    listJsonIds,
    readJson,
    readRawFile,
    relativePath,
    root,
    vitevalDir,
  };
}

export type FsHelper = ReturnType<typeof createFs>;
