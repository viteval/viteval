import { command, type Log } from 'maltty';
import { createVitest } from 'vitest/node';
import {
  LIST_ARGS,
  LIST_OPTIONS,
  LIST_POSITIONALS,
  LIST_VALUE_FLAGS,
} from '#/lib/command-options';
import { resolveProjectConfig } from '#/lib/config';
import {
  createEvaluationDiscoveryPlugin,
  createRunnerOverrides,
  extractFileFilters,
} from '#/lib/runner-config';

export const listCommand = command({
  description: 'List evaluations without running tasks or scorers',
  options: LIST_OPTIONS,
  positionals: LIST_POSITIONALS,
  handler: async ({ args, log, raw }) => {
    await listEvaluations({
      argv: args,
      filters: extractFileFilters({
        argv: raw.argv,
        command: 'list',
        valueFlags: LIST_VALUE_FLAGS,
      }),
      log,
    });
  },
});

/** A discovered evaluation: its name and the file that declares it. */
export interface ListedEvaluation {
  name: string;
  file: string;
}

/**
 * List evaluation names through Vitest's dynamic collection.
 *
 * The discovery plugin keeps collection from executing evaluation bodies, so
 * data generators, tasks, and scorers never run; paid work stays untouched.
 * Collection failures set exit code 1 and suppress the listing.
 *
 * @param params - Maltty args, positional file filters, and a logger.
 * @returns Resolves after names are printed or failures are reported.
 * @example await listEvaluations({ argv: { json: true }, filters: [], log });
 */
export async function listEvaluations(params: {
  argv: Record<string, unknown>;
  filters?: readonly string[];
  log: Pick<Log, 'info' | 'error'>;
}): Promise<void> {
  const argv = LIST_ARGS.parse(params.argv),
    project = resolveProjectConfig(argv),
    overrides = createRunnerOverrides({
      argv: { root: argv.root, config: argv.config, watch: false },
      project,
      plugins: [createEvaluationDiscoveryPlugin()],
    }),
    vitest = await createVitest(overrides.test, overrides.vite);
  const { testModules: modules, unhandledErrors } = await vitest
    .collect([...(params.filters ?? [])], {
      staticParse: false,
    })
    .finally(() => vitest.close());

  const errors = [
    ...modules.flatMap((module) =>
      module.errors().map((error) => error.message)
    ),
    ...unhandledErrors.map((error) =>
      error instanceof Error ? error.message : String(error)
    ),
  ];
  if (errors.length) {
    params.log.error(`Evaluation collection failed:\n${errors.join('\n')}`);
    process.exitCode = 1;
    return;
  }

  const evaluations: ListedEvaluation[] = modules
    .flatMap((module) =>
      [...module.children.suites()].map((suite) => ({
        name: suite.name,
        file: module.relativeModuleId,
      }))
    )
    .toSorted(
      (a, b) => a.file.localeCompare(b.file) || a.name.localeCompare(b.name)
    );

  if (argv.json) {
    process.stdout.write(`${JSON.stringify(evaluations, null, 2)}\n`);
    return;
  }
  if (!evaluations.length) {
    params.log.info('No evaluations found');
    return;
  }
  for (const evaluation of evaluations)
    params.log.info(`${evaluation.file} > ${evaluation.name}`);
}
