import { command } from 'maltty';
import { UI_OPTIONS } from '#/lib/command-options';
import { runNodeCli } from '#/lib/node-cli';

export default command({
  description: 'Start the UI server to view evaluation results',
  options: UI_OPTIONS,
  handler: ({ raw }) => runNodeCli(raw.argv.slice(1)),
});
