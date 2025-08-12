import path from 'node:path';
import { findUp } from 'find-up';
import { createVitest } from 'vitest/node';
import type { CommandModule } from 'yargs';

export const runCommand: CommandModule<unknown, EvalOptions> = {
  command: 'run [pattern]',
  describe: 'Run evaluations',
  aliases: ['*'],
  builder: (yargs) => {
    return (
      yargs
        .positional('pattern', {
          describe: 'Eval file pattern to match',
          type: 'string',
          default: '**/*.eval.{js,ts,mts,mjs}',
        })
        // TODO: add reporters support
        // .option('reporter', {
        //   alias: 'r',
        //   describe: 'Reporter to use',
        //   type: 'string',
        //   default: 'console',
        //   choices: ['console', 'json', 'braintrust'],
        // })
        .option('root', {
          alias: 'r',
          describe: 'Root directory to run evaluations from',
          type: 'string',
        })
        .option('config', {
          alias: 'c',
          describe: 'Viteval config file',
          type: 'string',
        })
    );
  },
  handler: async (argv) => {
    const root = path.resolve(argv.root ?? process.cwd()).replace(/\\/g, '/');

    const configFilePath =
      argv.config ??
      (await findUp(
        ['ts', 'js', 'mts', 'mjs'].map((ext) => `viteval.config.${ext}`),
        {
          cwd: root,
        }
      ));

    const vitest = await createVitest(
      'test',
      {
        config: configFilePath,
      },
      {},
      {}
    );

    try {
      // this will set process.exitCode to 1 if tests failed,
      // and won't close the process automatically
      await vitest.start();
    } finally {
      await vitest.close();
    }
  },
};

interface EvalOptions {
  pattern?: string;
  reporter?: string;
  root?: string;
  config?: string;
  watch?: boolean;
}
