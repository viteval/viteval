import path from 'node:path';
import { JsonReporter, type VitevalReporter } from '@viteval/core/reporters';
import { type DangerouslyAllowAny, withResult } from '@viteval/internal';
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
  builder: (yargs) => {
    return yargs
      .positional('pattern', {
        describe: 'Eval file pattern to match',
        type: 'string',
      })
      .option('reporters', {
        alias: 'r',
        describe: 'Reporter to use',
        type: 'array',
        choices: ['default', 'json', 'file'],
      })
      .option('ui', {
        alias: 'u',
        describe: 'Start the UI server',
        type: 'boolean',
        default: false,
      })
      .option('root', {
        describe: 'Root directory to run evaluations from',
        type: 'string',
      })
      .option('config', {
        alias: 'c',
        describe: 'Viteval config file',
        type: 'string',
      });
  },
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

    const configResolutionResult = await withResult(async () => {
      return await resolveConfig({
        config: configFilePath,
        root,
      });
    });

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

    const reporters = getReporters(argv, vitestConfig);

    // We don't want to have the field present as it causes issues with Vitest's config merging
    const cliConfig: DangerouslyAllowAny = {};
    if (argv.pattern) {
      cliConfig.include = [argv.pattern];
    }

    const vitest = await createVitest('test', {
      config: configFilePath,
      root,
      reporters,
      watch: false,
      ...cliConfig,
    });

    try {
      // start the UI server if the --ui flag is passed
      const serverResult = argv.ui
        ? createVitevalServer({
            debug: process.env.VITEVAL_DEBUG_MODE === 'true',
          }).start()
        : undefined;

      // this will set process.exitCode to 1 if tests failed,
      // and won't close the process automatically
      await vitest.start();

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

function getReporters(argv: EvalOptions, config?: ResolvedConfig) {
  const argReporters = (
    argv.ui ? ['default', 'file'] : (argv.reporters ?? [])
  ) as VitevalReporter[];
  if (argReporters.length > 0) {
    return buildReporters(
      argReporters.map((reporter) => ({
        options: match(reporter)
          .with('json', () => ({
            outputFile: argv.outputPath
              ? formatOutputFile(argv.outputPath)
              : undefined,
          }))
          .with('file', () => ({
            outputFile: argv.outputPath
              ? formatOutputFile(argv.outputPath)
              : formatOutputFile('.viteval/results/<timestamp>.json'),
          }))
          .otherwise(() => ({})),
        reporter,
      }))
    );
  }

  if (config?.reporters && config.reporters.length > 0) {
    const formattedReporters = config.reporters
      .flatMap((reporter) =>
        match(reporter)
          .with(P.array(), (r) => r.filter((r) => typeof r === 'string'))
          .otherwise(() => null)
      )
      .filter((reporter) => reporter !== null) as VitevalReporter[];

    return buildReporters(
      formattedReporters.map((reporter) => ({
        options: {},
        reporter,
      }))
    );
  }

  return buildReporters([
    {
      options: {},
      reporter: 'default',
    },
  ]);
}

function buildReporters(
  input: {
    reporter: VitevalReporter;
    options: Record<string, DangerouslyAllowAny>;
  }[]
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
                formatOutputFile('.viteval/results/<timestamp>.json'))
              : options.outputFile,
        })
      );
    } else {
      reporters.push(reporter);
    }
  }

  return reporters;
}

function formatOutputFile(outputFile: string) {
  return outputFile.replace('<timestamp>', Date.now().toString());
}
