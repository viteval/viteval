import { createVitevalServer } from '@viteval/ui';
import { command } from 'maltty';
import open from 'open';
import { UI_ARGS, UI_OPTIONS } from '#/lib/command-options';

export const uiCommand = command({
  description: 'Start the UI server to view evaluation results',
  options: UI_OPTIONS,
  handler: async ({ args, log }) => {
    const argv = UI_ARGS.parse(args);
    const server = createVitevalServer({
      debug: argv.debug || process.env.VITEVAL_DEBUG_MODE === 'true',
      port: argv.port,
      root: argv.root,
    });
    const shutdown = async () => {
      log.info('Shutting down...');
      await server.shutdown();
      log.newline();
      process.exit(0);
    };

    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);

    try {
      const port = await server.start();
      const url = `http://localhost:${port}`;

      if (argv.open) {
        log.info('Opening the browser...');
        await open(url);
      }

      log.success(`View the results at ${url}`);

      await server.waitForExit();
    } catch (error) {
      await server.shutdown();
      log.error(
        `Failed to start: ${error instanceof Error ? error.message : String(error)}`
      );
      log.newline();
      process.exitCode = 1;
    } finally {
      process.removeListener('SIGINT', shutdown);
      process.removeListener('SIGTERM', shutdown);
    }
  },
});
