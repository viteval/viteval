import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { runCommand } from '#/commands/run';

(async () => {
  await yargs(hideBin(process.argv))
    .scriptName('viteval')
    .usage('$0 <command> [options]')
    .command(runCommand)
    // .command(testCommand)
    .demandCommand(1, 'You must specify a command')
    .help()
    .alias('help', 'h')
    .version()
    .alias('version', 'v')
    .strict()
    .parseAsync();
})();
