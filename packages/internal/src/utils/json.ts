import { randomUUID } from 'node:crypto';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Serialize JSON without silently accepting unsupported values.
 * @param value - The value to serialize. Dates become ISO strings.
 * @returns Formatted JSON. Throws for cycles, non-finite numbers, and unsupported objects.
 * @example
 * serializeJson({ score: 1 });
 */
export function serializeJson(value: unknown): string {
  const json = JSON.stringify(
    value,
    (_key, item: unknown) => {
      if (typeof item === 'number' && !Number.isFinite(item)) {
        throw new Error('JSON values must contain finite numbers');
      }
      if (['bigint', 'function', 'symbol'].includes(typeof item)) {
        throw new Error(`Unsupported JSON value: ${typeof item}`);
      }
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const prototype: unknown = Object.getPrototypeOf(item);
        if (prototype !== Object.prototype && prototype !== null) {
          throw new Error(
            'JSON values must be plain objects, arrays, or dates'
          );
        }
      }
      return item;
    },
    2
  );
  if (json === undefined) {
    throw new Error('The top-level value is not JSON serializable');
  }
  return `${json}\n`;
}

/**
 * Replace a JSON file atomically, preserving the previous file on serialization failure.
 * @param params - Destination path and JSON value.
 * @returns Resolves after the replacement is visible to readers.
 * @example
 * await writeJsonAtomic({ filePath: 'results.json', value: { success: true } });
 */
export async function writeJsonAtomic({
  filePath,
  value,
}: {
  filePath: string;
  value: unknown;
}): Promise<void> {
  const content = serializeJson(value);
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, content, { flag: 'wx' });
    await rename(temporaryPath, filePath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}
