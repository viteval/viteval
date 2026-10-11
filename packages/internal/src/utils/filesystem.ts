import fs from 'node:fs/promises';
import path from 'node:path';
import { attemptAsync, isErr, ok, type Result } from 'massaman/control';

/**
 * Check if a file exists
 * @param filePath - The path to check for a file
 * @returns True if the file exists, false otherwise
 */
export async function fileExists(filePath: string): Promise<Result<boolean>> {
  const result = await attemptAsync(() => fs.access(filePath));
  if (result.ok) {
    return ok(true);
  }

  return isNotFoundError(result.error) ? ok(false) : result;
}

/**
 * Check if a directory exists
 * @param filePath - The path to check for a directory
 * @returns True if the directory exists, false otherwise
 */
export async function directoryExists(
  filePath: string
): Promise<Result<boolean>> {
  return await fileExists(filePath);
}

/**
 * Create a directory
 * @param filePath - The path to create the directory
 * @returns True if the directory was created, false if it already exists
 */
export async function createDirectory(
  filePath: string
): Promise<Result<boolean>> {
  return await attemptAsync(async () => {
    const dirPath = path.dirname(filePath);
    const created = await fs.mkdir(dirPath, { recursive: true });
    return created !== undefined;
  });
}

/**
 * Create a file
 * @param filePath - The path to create the file
 * @param content - The content to write to the file
 * @returns True if the file was created, false if it already exists
 */
export async function createFile(
  filePath: string,
  content: string
): Promise<Result<boolean>> {
  const exists = await fileExists(filePath);
  if (isErr(exists) || exists.value) {
    return exists.ok ? ok(false) : exists;
  }

  const directory = await createDirectory(filePath);
  if (isErr(directory)) {
    return directory;
  }

  return await attemptAsync(async () => {
    await fs.writeFile(filePath, content);
    return true;
  });
}

function isNotFoundError(error: Error): boolean {
  return 'code' in error && error.code === 'ENOENT';
}
