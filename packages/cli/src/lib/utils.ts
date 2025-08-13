import path from 'node:path';
import { fileExists } from '@viteval/internal';

/**
 * Check if a package.json file exists in the given path or the current working directory
 * @param filePath - The path to check for a package.json file
 * @returns True if a package.json file exists, false otherwise
 */
export async function hasPackageJson(filePath: string = process.cwd()) {
  return fileExists(path.join(filePath, 'package.json'));
}
