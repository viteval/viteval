import { command, type Log } from 'maltty';
import { createVitest, TestsNotFoundError } from 'vitest/node';
import {
  RUN_ARGS,
  RUN_OPTIONS,
  RUN_POSITIONALS,
  RUN_VALUE_FLAGS,
} from '#/lib/command-options';
import { resolveProjectConfig } from '#/lib/config';
import { createRunnerOverrides, extractFileFilters } from '#/lib/runner-config';

export const runCommand = command({
  description: 'Run evaluations',
  options: RUN_OPTIONS,
  positionals: RUN_POSITIONALS,
  handler: async ({ args, log, raw }) => {
    await runEvaluations({
      argv: args,
      filters: extractFileFilters({
        argv: raw.argv,
        command: 'run',
        valueFlags: RUN_VALUE_FLAGS,
      }),
      log,
    });
  },
});

/**
 * Execute evaluations through Vitest's programmatic runner.
 *
 * Vitest's `start` sets the process exit status and its reporters print the
 * diagnostics; watch mode keeps the watcher alive until SIGINT/SIGTERM cancel
 * the current run, close Vitest, and remove their own signal listeners.
 *
 * @param params - Maltty or bare-invocation args, positional file filters, and a logger.
 * @returns Resolves after a non-watch run finishes or after a watch run is displayed.
 * @example await runEvaluations({ argv: { timeout: 5000 }, filters: [], log });
 */
export async function runEvaluations(params: {
  argv: Record<string, unknown>;
  filters?: readonly string[];
  log: Pick<Log, 'info' | 'error'>;
}): Promise<void> {
  const argv = RUN_ARGS.parse(params.argv),
    project = resolveProjectConfig(argv),
    overrides = createRunnerOverrides({ argv, project }),
    vitest = await createVitest(overrides.test, overrides.vite),
    filters = [...(params.filters ?? [])];

  let closing: Promise<void> | undefined;
  let shuttingDown = false;
  const interrupt = () => shutdownWatch('SIGINT');
  const terminate = () => shutdownWatch('SIGTERM');
  if (argv.watch) {
    process.on('SIGINT', interrupt);
    process.on('SIGTERM', terminate);
  }
  try {
    await vitest.start(filters);
  } catch (error) {
    await close();
    if (error instanceof TestsNotFoundError) {
      params.log.error(
        `No evaluation files found${
          filters.length ? ` matching ${filters.join(', ')}` : ''
        }. Check the include patterns in viteval.config.ts.`
      );
      process.exitCode = 1;
      return;
    }
    throw error;
  } finally {
    if (!argv.watch) await close();
  }
  if (argv.watch && !closing) {
    params.log.info(
      'Watching evaluation files for changes (press Ctrl+C to exit)'
    );
  }

  function close(): Promise<void> {
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', terminate);
    closing ??= vitest.close();
    return closing;
  }

  async function shutdownWatch(signal: 'SIGINT' | 'SIGTERM'): Promise<void> {
    if (shuttingDown) return;
    shuttingDown = true;
    process.exitCode = 128 + signalCodes[signal];
    try {
      await vitest.cancelCurrentRun('keyboard-input');
    } catch (error) {
      params.log.error(String(error));
    } finally {
      await close().catch((error: unknown) => params.log.error(String(error)));
    }
  }
}

const signalCodes: Record<string, number> = {
  SIGINT: 2,
  SIGTERM: 15,
};
