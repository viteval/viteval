import { cli, command } from 'maltty';
import { version } from '../package.json';
import { initCommand } from '#/commands/init';
import { parseInvocation } from '#/lib/argv';

const args = process.argv.slice(2),
  invocation = parseInvocation(args);

if (invocation.isProjectCommand || invocation.isRootHelp) {
  const { DATA_OPTIONS, DATA_POSITIONALS, UI_OPTIONS } =
    await import('#/lib/command-options');
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
      run: command({
        description: 'Run evaluations',
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
      order: ['run', 'init', 'data', 'ui'],
    },
    name: 'viteval',
    version,
  });
} else {
  if (invocation.cwd !== undefined) {
    process.chdir(invocation.cwd);
  }
  const { createCLI, parseCLI, startVitest } = await import('vitest/node');
  if (
    invocation.args.some((arg) =>
      ['--help', '-h', '--version', '-v'].includes(arg)
    )
  ) {
    createCLI().parse([...process.argv.slice(0, 2), ...invocation.args]);
  } else {
    const { createRunnerConfig } = await import('@viteval/core/config'),
      { resolveProjectConfig } = await import('#/lib/config'),
      parsed = parseCLI(['vitest', ...invocation.args]),
      project = resolveProjectConfig(parsed.options);
    await startVitest(
      parsed.filter,
      {
        ...parsed.options,
        config: project.configFile ?? false,
        root: project.root,
      },
      createRunnerConfig(project)
    );
  }
}
