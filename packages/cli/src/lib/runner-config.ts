import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Compose a project config with Viteval's adapter for every native CLI action.
 * @param project - Selected config file and discovery root.
 * @returns Temporary native config path and an idempotent cleanup callback.
 * @example const config = createCliRunnerConfig({ root: process.cwd() });
 */
export function createCliRunnerConfig(project: {
  configFile?: string;
  root: string;
}) {
  const directory = mkdtempSync(path.join(tmpdir(), 'viteval-cli-')),
    configFile = path.join(directory, 'config.mjs'),
    cleanup = () => rmSync(directory, { recursive: true, force: true }),
    source = project.configFile
      ? `import original from ${JSON.stringify(pathToFileURL(project.configFile).href)};`
      : 'const original = {};';
  try {
    writeFileSync(
      configFile,
      `${source}
import { createRunnerConfig } from ${JSON.stringify(import.meta.resolve('@viteval/core/config'))};
export default async (env) => {
  const config = await (typeof original === 'function' ? original(env) : original);
  const adapter = createRunnerConfig(${JSON.stringify(project)});
  return {
    ...config,
    root: config.root ?? ${JSON.stringify(project.root)},
    plugins: [...(config.plugins ?? []), ...(adapter.plugins ?? [])],
  };
};
`
    );
  } catch (error) {
    cleanup();
    throw error;
  }
  process.once('exit', cleanup);
  return {
    configFile,
    cleanup: () => {
      process.off('exit', cleanup);
      cleanup();
    },
  };
}
