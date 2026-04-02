import path from 'node:path';
import { JsonReporter, type VitevalReporter } from '@viteval/core/reporters';
import { createRun } from '@viteval/core';
import { withResult } from '@viteval/internal';
import { createVitevalServer } from '@viteval/ui';
import consola from 'consola';
import { findUp } from 'find-up';
import open from 'open';
import { P, match } from 'ts-pattern';
import {
  type Reporter,
  type ResolvedConfig,
  createVitest,
  resolveConfig,
} from 'vitest/node';
import type { CommandModule } from 'yargs';

export const runCommand: CommandModule<unknown, EvalOptions> = {
  aliases: ['*'],
  builder: (yargs) =>
    yargs
      .positional('pattern', {
        describe: 'Eval file pattern to match',
        type: 'string',
      })
      .option('reporters', {
        alias: 'r',
        choices: ['default', 'json', 'file'],
        describe: 'Reporter to use',
        type: 'array',
      })
      .option('ui', {
        alias: 'u',
        default: false,
        describe: 'Start the UI server',
        type: 'boolean',
      })
      .option('root', {
        describe: 'Root directory to run evaluations from',
        type: 'string',
      })
      .option('config', {
        alias: 'c',
        describe: 'Viteval config file',
        type: 'string',
      }),
  command: 'run [pattern] [options]',
  describe: 'Run evaluations',
  handler: async (argv) => {
    const root = path
      .resolve(process.cwd(), argv.root ?? '.')
      .replace(/\\/g, '/');

    const configFilePath =
      argv.config ??
      (await findUp(
        ['ts', 'js', 'mts', 'mjs'].map((ext) => `viteval.config.${ext}`),
        {
          cwd: root,
        }
      ));

    const configResolutionResult = await withResult(
      async () =>
        await resolveConfig({
          config: configFilePath,
          root,
        })
    );

    if (
      configResolutionResult.status === 'error' &&
      process.env.VITEVAL_DEBUG_MODE === 'true'
    ) {
      consola.error('Failed to resolve config');
      consola.error(configResolutionResult.result);
    }

    const vitestConfig = configResolutionResult.ok
      ? configResolutionResult.result.vitestConfig
      : undefined;

    const run = createRun();
    const reporters = getReporters(argv, vitestConfig, run);

    consola.info(`Run: ${run.name}`);

    const vitest = await createVitest('test', {
      config: configFilePath,
      reporters,
      root,
      watch: false,
    });

    try {
      // Start the UI server if the --ui flag is passed
      const serverResult = argv.ui
        ? createVitevalServer({
            debug: process.env.VITEVAL_DEBUG_MODE === 'true',
          }).start()
        : undefined;

      // Pass pattern as a filter to vitest.start() instead of overriding config.include,
      // Which would replace the user's configured include patterns
      const filters = argv.pattern ? [argv.pattern] : [];
      await vitest.start(filters);

      if (serverResult) {
        const serverPort = await serverResult;
        await open(`http://localhost:${serverPort}`);
        consola.info(`View the results at http://localhost:${serverPort}`);
        consola.log('');
      } else {
        consola.log('');
        process.exit(0);
      }
    } finally {
      await vitest.close();
    }
  },
};

interface EvalOptions {
  pattern?: string;
  reporters?: string[];
  root?: string;
  config?: string;
  watch?: boolean;
  outputPath?: string;
  ui?: boolean;
}

function getReporters(
  argv: EvalOptions,
  config: ResolvedConfig | undefined,
  run: { id: string; name: string }
) {
  const argReporters = (
    argv.ui ? ['default', 'file'] : (argv.reporters ?? [])
  ) as VitevalReporter[];

  if (argReporters.length > 0) {
    return buildReporters(
      argReporters.map((reporter) => ({
        options: match(reporter)
          .with('json', () => ({
            outputFile: argv.outputPath
              ? formatOutputFile(argv.outputPath, run.name)
              : undefined,
          }))
          .with('file', () => ({
            outputFile: argv.outputPath
              ? formatOutputFile(argv.outputPath, run.name)
              : formatOutputFile('.viteval/results/<run>.json', run.name),
          }))
          .otherwise(() => ({})),
        reporter,
      })),
      run
    );
  }

  if (config?.reporters && config.reporters.length > 0) {
    const formattedReporters = config.reporters
      .flatMap((reporter) =>
        match(reporter)
          .with(P.array(), (arr) => arr.filter((r) => typeof r === 'string'))
          .otherwise(() => null)
      )
      .filter((reporter) => reporter !== null) as VitevalReporter[];

    return buildReporters(
      formattedReporters.map((reporter) => ({
        options: {},
        reporter,
      })),
      run
    );
  }

  return buildReporters(
    [
      {
        options: {},
        reporter: 'default',
      },
    ],
    run
  );
}

function buildReporters(
  input: {
    reporter: VitevalReporter;
    options: Record<string, string | undefined>;
  }[],
  run: { id: string; name: string }
) {
  const reporters: (Reporter | string)[] = [];

  for (const { reporter, options } of input) {
    if (reporter === 'json' || reporter === 'file') {
      reporters.push(
        new JsonReporter({
          ...options,
          outputFile:
            reporter === 'file'
              ? (options.outputFile ??
                formatOutputFile('.viteval/results/<run>.json', run.name))
              : options.outputFile,
          run,
        })
      );
    } else {
      reporters.push(reporter);
    }
  }

  return reporters;
}

function formatOutputFile(outputFile: string, runName: string) {
  return outputFile.replace('<run>', runName);
}
