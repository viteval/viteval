import { cli, command } from 'maltty';
import { version } from '../package.json';
import { initCommand } from '#/commands/init';
import { parseInvocation } from '#/lib/argv';

const args = process.argv.slice(2),
  invocation = parseInvocation(args);

if (invocation.isBare) {
  if (invocation.cwd !== undefined) process.chdir(invocation.cwd);
  const { runEvaluations } = await import('#/commands/run');
  const { createLogger } = await import('#/lib/logger');
  const logger = createLogger();
  await runEvaluations({
    argv: {},
    filters: [],
    log: logger,
  });
} else {
  if (
    ![
      'run',
      'list',
      'init',
      'data',
      'ui',
      '--help',
      '-h',
      '--version',
      '-v',
    ].includes(invocation.args[0])
  ) {
    process.argv = [...process.argv.slice(0, 2), 'run', ...args];
  }
  const {
    DATA_OPTIONS,
    DATA_POSITIONALS,
    LIST_OPTIONS,
    LIST_POSITIONALS,
    RUN_OPTIONS,
    RUN_POSITIONALS,
    UI_OPTIONS,
  } = await import('#/lib/command-options');
  await cli({
    commands: {
      data: command({
        description: 'Generate the datasets in your codebase',
        options: DATA_OPTIONS,
        positionals: DATA_POSITIONALS,
        handler: async (ctx) => {
          const { dataCommand } = await import('#/commands/data');
          await dataCommand.handler?.(ctx);
        },
      }),
      init: initCommand,
      list: command({
        description: 'List evaluations without running tasks or scorers',
        options: LIST_OPTIONS,
        positionals: LIST_POSITIONALS,
        handler: async (ctx) => {
          const { listCommand } = await import('#/commands/list');
          await listCommand.handler?.(ctx);
        },
      }),
      run: command({
        description: 'Run evaluations',
        options: RUN_OPTIONS,
        positionals: RUN_POSITIONALS,
        handler: async (ctx) => {
          const { runCommand } = await import('#/commands/run');
          await runCommand.handler?.(ctx);
        },
      }),
      ui: command({
        description: 'Start the UI server to view evaluation results',
        options: UI_OPTIONS,
        handler: async (ctx) => {
          const { uiCommand } = await import('#/commands/ui');
          await uiCommand.handler?.(ctx);
        },
      }),
    },
    description: 'LLM evaluations powered by Vitest',
    help: {
      footer: 'Evaluation options: viteval run --help',
      order: ['run', 'list', 'init', 'data', 'ui'],
    },
    name: 'viteval',
    version,
  });
}
