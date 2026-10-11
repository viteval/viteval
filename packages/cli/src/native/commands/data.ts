import { command } from 'maltty';
import { DATA_OPTIONS, DATA_POSITIONALS } from '#/lib/command-options';
import { runNodeCli } from '#/lib/node-cli';

export default command({
  description: 'Generate the datasets in your codebase',
  options: DATA_OPTIONS,
  positionals: DATA_POSITIONALS,
  handler: ({ raw }) => runNodeCli(raw.argv.slice(1)),
});
