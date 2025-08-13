import fs from 'node:fs/promises';
import path from 'node:path';
import { wrapSafe } from './safe';

/**
 * Check if a file exists
 * @param filePath - The path to check for a file
 * @returns True if the file exists, false otherwise
 */
export async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a directory exists
 * @param filePath - The path to check for a directory
 * @returns True if the directory exists, false otherwise
 */
export async function directoryExists(filePath: string) {
  try {
    await fs.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a directory
 * @param filePath - The path to create the directory
 * @returns True if the directory was created, false if it already exists
 */
export async function createDirectory(filePath: string) {
  return await wrapSafe(async () => {
    const dirPath = path.dirname(filePath);
    const exists = await directoryExists(dirPath);
    if (exists) {
      return { status: 'exists', data: null };
    }

    await fs.mkdir(dirPath, { recursive: true });
    return { status: 'created', data: null };
  });
}

/**
 * Create a file
 * @param filePath - The path to create the file
 * @param content - The content to write to the file
 * @returns True if the file was created, false if it already exists
 */
export async function createFile(filePath: string, content: string) {
  return await wrapSafe(async () => {
    const exists = await fileExists(filePath);
    if (exists) {
      return { status: 'exists', data: null };
    }

    // We initialize the directory to avoid errors
    await createDirectory(filePath);

    await fs.writeFile(filePath, content);
    return { status: 'created', data: null };
  });
}
