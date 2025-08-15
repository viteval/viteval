import fs from 'node:fs/promises';
import path from 'node:path';
import type { DataItem, Dataset } from '@viteval/core';
import { findConfigFile } from '@viteval/core/config';
import { glob } from 'glob';
import { createJiti } from 'jiti';
import type { TsConfigJson } from 'type-fest';
import type { CommandModule } from 'yargs';
import { createLogger } from '#/lib/logger';

export const dataCommand: CommandModule<unknown, { pattern: string }> = {
  command: 'data [pattern]',
  describe: 'Generate the datasets in your codebase',
  builder: (yargs) => {
    return yargs.positional('pattern', {
      describe: 'Dataset file pattern to match',
      type: 'string',
      default: '**/*.dataset.{js,ts,mts,mjs}',
    });
  },
  handler: async (argv) => {
    const configFilePath = await findConfigFile(process.cwd());
    const logger = createLogger();

    if (!configFilePath) {
      throw new Error('No viteval config file found');
    }

    const rootPath = path.dirname(configFilePath);
    const tsConfig = await readTsConfig(rootPath);
    const aliases = getAliases(rootPath, tsConfig);

    const datasets = await glob(argv.pattern, {
      cwd: rootPath,
    });

    const jiti = createJiti(`file:${path.dirname(configFilePath)}`, {
      fsCache: false,
      moduleCache: false,
      interopDefault: true,
      sourceMaps: true,
      alias: {
        ...aliases,
      },
      transformOptions: {
        filename: '',
        ts: true,
      },
    });

    const mods: Mod[] = [];
    for (const dataset of datasets) {
      const resolvedPath = jiti.esmResolve(
        path.join(rootPath, dataset),
        rootPath
      );
      const datasetFn = await jiti.import<Mod>(resolvedPath, {
        default: true,
        try: true,
      });
      mods.push(datasetFn);
    }

    const results: {
      successes: string[];
      failures: string[];
    } = {
      successes: [],
      failures: [],
    };

    await Promise.all(
      mods.map(async (mod) => {
        // Just run the data function to generate it
        try {
          await mod.data({ overwrite: true });
          results.successes.push(mod.name);
        } catch {
          results.failures.push(mod.name);
        }
      })
    );

    if (results.failures.length > 0) {
      logger.error(
        `Failed to generate ${results.failures.length} datasets: ${results.failures.join(', ')}`
      );
      logger.info(
        `Successfully generated ${results.successes.length} datasets`
      );
    } else {
      logger.success(`Generated ${results.successes.length} datasets`);
    }
  },
};

type Mod = Dataset<() => Promise<DataItem[]>>;

function getAliases(
  rootPath: string,
  tsConfig?: TsConfigJson | null
): Record<string, string> {
  if (!tsConfig?.compilerOptions?.paths) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(tsConfig.compilerOptions.paths).map(([key, value]) => [
      key.replace('/*', ''),
      path.join(rootPath, value[0].replace('/*', '')),
    ])
  );
}

async function readTsConfig(rootPath: string): Promise<TsConfigJson | null> {
  try {
    const file = await fs.readFile(
      path.join(rootPath, 'tsconfig.json'),
      'utf8'
    );
    return JSON.parse(file);
  } catch {
    return null;
  }
}
