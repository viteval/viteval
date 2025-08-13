import path from 'node:path';
import { findConfigFile } from '#/config';

/**
 * Resolves a promise or returns the value.
 */
export async function resolve<T>(value: PromiseLike<T> | T): Promise<T> {
  if (value instanceof Promise) {
    return await value;
  }
  return new Promise<T>((resolve) => resolve(value));
}

/**
 * Finds the root directory of the project.
 *
 * @param root - The root directory to search for the config file.
 * @returns The root directory.
 */
export async function findRoot(root: string) {
  const configFile = await findConfigFile(root);

  if (!configFile) {
    throw new Error('No viteval config file found');
  }

  return path.dirname(configFile);
}
