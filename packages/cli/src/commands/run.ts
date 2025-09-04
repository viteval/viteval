import path from 'node:path';
import { JsonReporter, type VitevalReporter } from '@viteval/core/reporters';
import { withResult, type DangerouslyAllowAny } from '@viteval/internal';
import consola from 'consola';
import { findUp } from 'find-up';
import { match, P } from 'ts-pattern';
import {
  createVitest,
  type Reporter,
  type ResolvedConfig,
  resolveConfig,
} from 'vitest/node';
import type { CommandModule } from 'yargs';

export const runCommand: CommandModule<unknown, EvalOptions> = {
  command: 'run [pattern] [options]',
  describe: 'Run evaluations',
  aliases: ['*'],
  builder: (yargs) => {
    return yargs
      .positional('pattern', {
        describe: 'Eval file pattern to match',
        type: 'string',
        default: '**/*.eval.{js,ts,mts,mjs}',
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
        alias: 'x',
        describe: 'Root directory to run evaluations from',
        type: 'string',
      })
      .option('config', {
        alias: 'c',
        describe: 'Viteval config file',
        type: 'string',
      });
  },
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

    if (configResolutionResult.status === 'error' && process.env.VITEVAL_DEBUG_MODE === 'true') {
      consola.error('Failed to resolve config');
      consola.error(configResolutionResult.result);
    }

    const vitestConfig = configResolutionResult.ok ? configResolutionResult.result.vitestConfig : undefined;

    const reporters = getReporters(argv, vitestConfig);

    const vitest = await createVitest('test', {
      config: configFilePath,
      root,
      reporters,
      watch: false,
    });

    try {
      // this will set process.exitCode to 1 if tests failed,
      // and won't close the process automatically
      await vitest.start();
      if (argv.ui) {
        process.env.VITEVAL_ROOT_PATH = root;
        const { startDevServer } = await import('../lib/dev-server');
        consola.info('View the results at http://localhost:3000');
        await startDevServer();
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
        reporter,
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
      }))
    );
  }

  if (config && config.reporters && config.reporters.length > 0) {
    const formattedReporters = config.reporters
      .flatMap((reporter) =>
        match(reporter)
          .with(P.array(), (r) => {
            return r.filter((r) => typeof r === 'string');
          })
          .otherwise(() => null)
      )
      .filter((reporter) => reporter !== null) as VitevalReporter[];

    return buildReporters(
      formattedReporters.map((reporter) => ({
        reporter,
        options: {},
      }))
    );
  }

  return buildReporters([
    {
      reporter: 'default',
      options: {},
    },
  ]);
}

function buildReporters(
  input: Array<{
    reporter: VitevalReporter;
    options: Record<string, DangerouslyAllowAny>;
  }>
) {
  const reporters: Array<Reporter | string> = [];

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
