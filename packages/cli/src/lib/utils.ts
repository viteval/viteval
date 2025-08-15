import path from 'node:path';
import type { VitevalConfig } from '@viteval/core/config';
import { fileExists } from '@viteval/internal';
import { loadConfig } from 'c12';
import type { TsConfigJson } from 'type-fest';

/**
 * Check if a package.json file exists in the given path or the current working directory
 * @param filePath - The path to check for a package.json file
 * @returns True if a package.json file exists, false otherwise
 */
export async function hasPackageJson(filePath: string = process.cwd()) {
  return fileExists(path.join(filePath, 'package.json'));
}

/**
 * Check if a tsconfig.json file exists in the given path or the current working directory
 * @param filePath - The path to check for a tsconfig.json file
 * @returns True if a tsconfig.json file exists, false otherwise
 */
export async function hasTSConfig(filePath: string = process.cwd()) {
  return fileExists(path.join(filePath, 'tsconfig.json'));
}

/**
 * Read the tsconfig.json file from the given path or the current working directory
 * @param filePath - The path to read the tsconfig.json file from
 * @returns The tsconfig.json file
 */
export async function loadTSConfig(
  filePath: string = process.cwd()
): Promise<TsConfigJson | null> {
  try {
    const result = await loadConfig({
      cwd: filePath,
      configFile: 'tsconfig.json',
    });

    return result.config;
  } catch {
    return null;
  }
}

/**
 * Read the viteval.config.ts/js/mts/mjs file from the given path or the current working directory
 * @param filePath - The path to read the viteval.config.ts file from
 * @returns The viteval.config.ts/js/mts/mjs file
 */
export async function loadVitevalConfig(
  filePath: string = process.cwd()
): Promise<VitevalConfig | null> {
  try {
    const result = await loadConfig({
      cwd: filePath,
      configFile: 'viteval.config',
    });

    return result.config;
  } catch {
    return null;
  }
}
