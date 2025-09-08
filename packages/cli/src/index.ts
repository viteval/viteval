import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { dataCommand } from '#/commands/data';
import { initCommand } from '#/commands/init';
import { runCommand } from '#/commands/run';
import { uiCommand } from '#/commands/ui';

(async () => {
  await yargs(hideBin(process.argv))
    .scriptName('viteval')
    .usage('$0 <command> [options]')
    .command(runCommand)
    .command(dataCommand)
    .command(initCommand)
    .command(uiCommand)
    .demandCommand(1, 'You must specify a command')
    .help()
    .alias('help', 'h')
    .version()
    .alias('version', 'v')
    .strict()
    .parseAsync();
})();
