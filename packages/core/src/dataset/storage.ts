import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createFile, fileExists, withResult } from '@viteval/internal';
import type { DataItem, DatasetStorage } from '#/types';

export interface DatasetStorageConfig {
  name: string;
  root: string;
  storage: DatasetStorage;
}

/**
 * Create a dataset storage
 * @param payload - The payload for the dataset storage
 * @returns The dataset storage
 */
export function createDatasetStorage<INPUT, OUTPUT>(
  payload: DatasetStorageConfig
) {
  const { name, root, storage } = payload;
  assertStorage(storage);
  return {
    /**
     * Check if the dataset exists in the storage
     * @returns True if the dataset exists, false otherwise
     */
    async exists(): Promise<boolean> {
      const filePath = getDatasetPath(root, name);
      const exists = await fileExists(filePath);
      return exists;
    },
    /**
     * Save the dataset to the storage
     * @param data - The dataset to save
     */
    async save(data: DataItem<INPUT, OUTPUT>[]): Promise<void> {
      const filePath = getDatasetPath(root, name);
      await createFile(
        filePath,
        JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            data,
          },
          null,
          2
        )
      );
    },
    /**
     * Load the dataset from the storage
     * @returns The dataset
     */
    async load(): Promise<DataItem<INPUT, OUTPUT>[] | null> {
      const R = await withResult(async () => {
        const filePath = getDatasetPath(root, name);
        if (!(await this.exists())) {
          return null;
        }
        const data = await readFile(filePath, 'utf-8');
        return JSON.parse(data).data as DataItem<INPUT, OUTPUT>[];
      });

      if (R.status === 'error') {
        throw R.result;
      }

      return R.result;
    },
  };
}

/*
|------------------
| Internals
|------------------
*/

function assertStorage(storage: DatasetStorage): asserts storage is 'local' {
  if (storage !== 'local') {
    throw new Error(`Unsupported storage type: ${storage}`);
  }
}

function getDatasetPath(root: string, name: string) {
  return path.join(root, '.viteval', 'datasets', `${name}.json`);
}
