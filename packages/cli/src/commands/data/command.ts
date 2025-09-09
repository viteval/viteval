import path from 'node:path';
import { ProgressBar } from '@opentf/cli-pbar';
import type { DataItem, Dataset } from '@viteval/core';
import { findConfigFile } from '@viteval/core/config';
import chalk from 'chalk';
import { glob } from 'glob';
import { createJiti } from 'jiti';
import type { TsConfigJson } from 'type-fest';
import type { CommandModule } from 'yargs';
import { createLogger } from '#/lib/logger';
import { hasTSConfig, loadTSConfig, loadVitevalConfig } from '#/lib/utils';

export const dataCommand: CommandModule<
  unknown,
  { pattern: string; overwrite?: boolean; verbose?: boolean }
> = {
  command: 'data [pattern]',
  describe: 'Generate the datasets in your codebase',
  builder: (yargs) => {
    return yargs
      .positional('pattern', {
        describe: 'Dataset file pattern to match',
        type: 'string',
        default: '**/*.dataset.{js,ts,mts,mjs}',
      })
      .option('overwrite', {
        describe: 'Overwrite existing datasets',
        type: 'boolean',
        default: false,
      })
      .option('verbose', {
        alias: 'V',
        describe: 'Verbose output',
        type: 'boolean',
        default: false,
      });
  },
  handler: async (argv) => {
    const logger = createLogger();

    try {
      const configFilePath = await findConfigFile(process.cwd());
      if (!configFilePath) {
        logger.error('No viteval config file found');
        process.exit(1);
      }

      const rootPath = path.dirname(configFilePath);
      const tsConfig = await loadTSConfig(rootPath);
      const aliases = getAliases(rootPath, tsConfig);
      const vitevalConfig = await loadVitevalConfig(rootPath);

      // If there is a TSConfig but we couldn't load it, throw an error
      if (!tsConfig && (await hasTSConfig(rootPath))) {
        logger.error(
          'Unable to load tsconfig.json file, make sure it is valid JSON'
        );
        process.exit(1);
      }

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

      try {
        // @ts-expect-error - TODO: fix this
        if (vitevalConfig?.test?.setupFiles) {
          await Promise.all(
            // @ts-expect-error - TODO: fix this
            vitevalConfig.test.setupFiles.map(async (file) => {
              const resolvedPath = jiti.esmResolve(
                path.join(rootPath, file),
                rootPath
              );
              return await jiti.import<Mod>(resolvedPath, {
                default: true,
                try: true,
              });
            })
          );
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        logger.error(
          `Failed loading Viteval setup files${
            argv.verbose ? `: ${err.message}` : ''
          }`
        );
        process.exit(1);
      }

      const mods: Mod[] = [];
      await Promise.all(
        datasets.map(async (dataset) => {
          const resolvedPath = jiti.esmResolve(
            path.join(rootPath, dataset),
            rootPath
          );
          const datasetFn = await jiti.import<Mod>(resolvedPath, {
            default: true,
            try: true,
          });
          mods.push(datasetFn);
        })
      );

      const results: {
        successes: Array<{ name: string; error?: null }>;
        failures: Array<{ name: string; error: Error }>;
        skipped: Array<{ name: string }>;
      } = {
        successes: [],
        failures: [],
        skipped: [],
      };

      const progressBar = new ProgressBar({
        size: 'MEDIUM',
        variant: 'PLAIN',
        prefix: 'Generating datasets',
        showPercent: false,
        showCount: true,
      });
      progressBar.start();

      await Promise.all(
        mods.map(async (mod, index) => {
          // If we are not overwriting, check if the dataset exists
          // and skip it if it does
          if (argv.overwrite !== true) {
            try {
              if (await mod.exists()) {
                results.skipped.push({ name: mod.name });
                return;
              }
            } catch {
              // Do nothing
            }
          }

          // Just run the data function to generate it
          const progressBarItem = progressBar.add({
            total: 100,
            id: index,
            progress: true,
            suffix: chalk.cyan(mod.name),
          });
          let value = 0;
          const inc = 1;
          const wait = 350;
          const intervalId = setInterval(() => {
            value += inc;
            if (value >= 100) {
              clearInterval(intervalId);
              return;
            }
            progressBarItem.update({ value });
          }, wait);

          try {
            // import the dataset
            await mod.save({ overwrite: argv.overwrite });
            results.successes.push({ name: mod.name });

            clearInterval(intervalId);
            progressBarItem.update({
              value: 100,
            });
          } catch (error) {
            results.failures.push({ name: mod.name, error: error as Error });
            clearInterval(intervalId);
            progressBarItem.update({
              value: 100,
            });
          }
        })
      );

      progressBar.stop();

      if (results.failures.length > 0) {
        if (argv.verbose) {
          logger.error(
            [
              `Failed to generate ${results.failures.length} datasets:`,
              '\n\n',
              ...results.failures.map(
                (f) => `  ${chalk.red('>')} ${f.name}: ${f.error.message}`
              ),
              '\n',
            ].join('')
          );
        } else {
          logger.error(
            `Failed to generate ${results.failures.length} datasets: ${results.failures.map((f) => f.name).join(', ')}`
          );
        }

        logger.info(
          `Successfully generated ${results.successes.length} datasets`
        );
      } else {
        logger.info(
          `Skipped ${results.skipped.length} datasets as they already exist`
        );
        logger.success(`Generated ${results.successes.length} datasets`);
      }
      logger.log('');
      process.exit(0);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logger.error(`Failed to generate datasets: ${err.message}`);
      logger.log('');
      process.exit(1);
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
