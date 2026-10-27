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
  const { createCLI } = await import('vitest/node');
  if (
    invocation.args.some((arg) =>
      ['--help', '-h', '--version', '-v'].includes(arg)
    )
  ) {
    createCLI().parse([...process.argv.slice(0, 2), ...invocation.args]);
  } else {
    const { resolveProjectConfig } = await import('#/lib/config'),
      { createCliRunnerConfig } = await import('#/lib/runner-config'),
      nativeCli = createCLI(),
      parsed = nativeCli.parse(
        [...process.argv.slice(0, 2), ...invocation.args],
        { run: false }
      ),
      project = resolveProjectConfig(parsed.options),
      runnerConfig = createCliRunnerConfig(project);
    nativeCli.options = {
      ...nativeCli.options,
      ...(nativeCli.matchedCommandName === 'list'
        ? { staticParse: parsed.options.staticParse ?? false }
        : {}),
      ...(parsed.options.root !== undefined ? { root: project.root } : {}),
      config: runnerConfig.configFile,
    };
    // Watch mode returns after its first run; keep the wrapper until process exit.
    await nativeCli.runMatchedCommand();
  }
}
