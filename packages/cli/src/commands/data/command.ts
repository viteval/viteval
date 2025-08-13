import path from 'node:path';
import type { DataItem, Dataset } from '@viteval/core';
import { findConfigFile } from '@viteval/core/config';
import { glob } from 'glob';
import { createJiti } from 'jiti';
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

    const datasets = await glob(argv.pattern, {
      cwd: rootPath,
    });

    const jiti = createJiti(`file:${configFilePath}`, {
      fsCache: false,
      moduleCache: false,
      extensions: ['ts', 'js', 'mts', 'mjs'],
      interopDefault: true,
      transformOptions: {
        ts: true,
      },
    });

    const mods: Mod[] = [];
    for (const dataset of datasets) {
      const datasetFn = await jiti.import<Mod>(path.join(rootPath, dataset), {
        default: true,
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
