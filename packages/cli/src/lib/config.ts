import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Find Viteval configuration before handing execution to the internal runner.
 * @param options - Explicit root/config overrides from the command line.
 * @returns The selected file and its project root.
 * @example resolveProjectConfig({ root: './support' });
 */
export function resolveProjectConfig(options: {
  root?: string;
  config?: string | false;
}) {
  const root = path.resolve(options.root ?? process.cwd());
  if (options.config === false) {
    return { root, configFile: undefined };
  }
  if (options.config) {
    const configFile = path.resolve(root, options.config);
    return { configFile, root: options.root ? root : path.dirname(configFile) };
  }
  for (const name of ['viteval', 'vitest']) {
    for (const extension of ['ts', 'mts', 'js', 'mjs', 'cts', 'cjs']) {
      const configFile = path.join(root, `${name}.config.${extension}`);
      if (existsSync(configFile)) {
        return { root, configFile };
      }
    }
  }
  return { configFile: undefined, root };
}
