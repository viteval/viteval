import { cli, command } from 'maltty';
import { version } from '../../package.json';
import { initCommand } from '#/commands/init';
import { runNodeCli } from '#/lib/node-cli';
import { parseInvocation } from '#/lib/argv';
import data from './commands/data';
import ui from './commands/ui';

const args = process.argv.slice(2);
const invocation = parseInvocation(args);

if (
  ['init', 'data', 'ui'].includes(invocation.args[0]) ||
  (invocation.args.length === 1 &&
    ['--help', '-h', '--version', '-v'].includes(invocation.args[0]))
) {
  await cli({
    name: 'viteval',
    version,
    description: 'LLM evaluations powered by Vitest',
    help: {
      footer: 'Evaluation options: viteval run --help',
      order: ['run', 'list', 'init', 'data', 'ui'],
    },
    commands: {
      run: command({
        description: 'Run evaluations',
      }),
      list: command({
        description: 'List evaluations without running tasks or scorers',
      }),
      init: initCommand,
      data,
      ui,
    },
  });
} else {
  try {
    if (invocation.cwd !== undefined) process.chdir(invocation.cwd);
    await runNodeCli(invocation.args);
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`
    );
    process.exitCode = 1;
  }
}
