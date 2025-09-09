import { createVitevalServer } from '@viteval/ui';
import consola from 'consola';
import open from 'open';
import type { CommandModule } from 'yargs';

export const uiCommand: CommandModule<unknown, UIOptions> = {
  command: 'ui [options]',
  describe: 'Start the UI server to view evaluation results',
  builder: (yargs) => {
    return yargs
      .option('port', {
        alias: 'p',
        describe: 'Port to run the UI server on',
        type: 'number',
      })
      .option('open', {
        alias: 'o',
        describe: 'Open the UI in the browser',
        type: 'boolean',
        default: false,
      })
      .option('debug', {
        alias: 'd',
        describe: 'Enable debug mode',
        type: 'boolean',
        default: false,
      });
  },
  handler: async (argv) => {
    try {
      const server = createVitevalServer({
        debug: argv.debug || process.env.VITEVAL_DEBUG_MODE === 'true',
        port: argv.port,
      });

      const port = await server.start();
      const url = `http://localhost:${port}`;

      if (argv.open) {
        consola.info('Opening the browser...');
        await open(url);
      }

      consola.success(`View the results at ${url}`);

      // Keep the process running
      process.on('SIGINT', async () => {
        consola.info('Shutting down...');
        consola.log('');
        process.exit(0);
      });

      // Keep the process alive
      await new Promise(() => {});
    } catch (error) {
      consola.error('Failed to start:', error);
      consola.log('');
      process.exit(1);
    }
  },
};

interface UIOptions {
  port?: number;
  open?: boolean;
  debug?: boolean;
}
