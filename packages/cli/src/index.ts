import { cli, command } from 'maltty';
import { version } from '../package.json';
import { initCommand } from '#/commands/init';
import { parseInvocation } from '#/lib/argv';

const args = process.argv.slice(2);
const invocation = parseInvocation(args);

if (invocation.isProjectCommand || invocation.isRootHelp) {
  const { DATA_OPTIONS, DATA_POSITIONALS, UI_OPTIONS } =
    await import('#/lib/command-options');
  await cli({
    name: 'viteval',
    version,
    description: 'LLM evaluations powered by Vitest',
    help: {
      footer: 'Evaluation options: viteval run --help',
      order: ['run', 'init', 'data', 'ui'],
    },
    commands: {
      run: command({
        description: 'Run evaluations with native Vitest options',
      }),
      init: initCommand,
      data: command({
        description: 'Generate the datasets in your codebase',
        options: DATA_OPTIONS,
        positionals: DATA_POSITIONALS,
        handler: async (ctx) => {
          const { dataCommand } = await import('#/commands/data');
          await dataCommand.handler?.(ctx);
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
  });
} else {
  if (invocation.cwd !== undefined) process.chdir(invocation.cwd);
  const { createCLI } = await import('vitest/node');
  createCLI().parse([...process.argv.slice(0, 2), ...invocation.args]);
}
