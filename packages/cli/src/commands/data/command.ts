import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { glob } from 'glob';
import { command } from 'maltty';
import { createVitest, type Reporter } from 'vitest/node';
import type { TestArtifactBase } from 'vitest';
import { createDatasetWorker } from '#/commands/data/worker';
import {
  DATA_ARGS,
  DATA_OPTIONS,
  DATA_POSITIONALS,
} from '#/lib/command-options';

export const dataCommand = command({
  description: 'Generate the datasets in your codebase',
  options: DATA_OPTIONS,
  positionals: DATA_POSITIONALS,
  handler: async ({ args, log: logger, status, colors }) => {
    const argv = DATA_ARGS.parse(args);
    const outcomes = new Map<string, DatasetOutcome>();
    let progress: ReturnType<typeof status.progress> | undefined;
    const reporter: Reporter = {
      onTestModuleCollected(testModule) {
        const datasets = [...testModule.children.allTests()].filter(
          (testCase) => testCase.meta().vitevalDataset === true
        );
        if (process.stderr.isTTY && datasets.length) {
          progress = status.progress({ max: datasets.length });
          progress.start('Generating datasets');
        }
      },
      onTestCaseResult(testCase) {
        if (testCase.meta().vitevalDataset !== true) return;
        const artifact = testCase.artifacts().findLast(isDatasetOutcome);
        const result = testCase.result();
        const outcome: DatasetOutcome =
          result.state === 'failed'
            ? {
                type: 'viteval:dataset',
                name: artifact?.name ?? testCase.name,
                kind: 'failed',
                error: result.errors.map((error) => error.message).join('\n'),
              }
            : (artifact ?? {
                type: 'viteval:dataset',
                name: testCase.name,
                kind: 'skipped',
              });
        outcomes.set(testCase.id, outcome);
        progress?.advance(1, outcome.name);
      },
    };
    try {
      const vitest = await createVitest({
        config: argv.config,
        root: path.resolve(process.cwd(), argv.root ?? '.'),
        run: true,
        watch: false,
        testNamePattern: '^viteval dataset: ',
        reporters: [reporter],
      });

      let workerPath: string | undefined;
      try {
        const project = argv.project
          ? vitest.getProjectByName(argv.project)
          : vitest.getRootProject();
        if (argv.project && project.name !== argv.project) {
          logger.error(`Vitest project "${argv.project}" was not found`);
          process.exitCode = 1;
          return;
        }
        const rootPath = project.config.root;
        const datasets = await glob(argv.pattern, {
          cwd: rootPath,
          ignore: ['**/node_modules/**', '**/.git/**'],
        }).then((files) => files.toSorted());

        if (datasets.length === 0) {
          logger.error(`No datasets found matching pattern, "${argv.pattern}"`);
          process.exitCode = 1;
          return;
        }

        workerPath = path.join(
          rootPath,
          '.viteval',
          `.data-${randomUUID()}.test.mjs`
        );
        await mkdir(path.dirname(workerPath), { recursive: true });
        await writeFile(
          workerPath,
          createDatasetWorker({
            files: datasets.map((file) => path.resolve(rootPath, file)),
            root: rootPath,
            overwrite: argv.overwrite,
          }),
          { flag: 'wx' }
        );
        const run = await vitest.runTestSpecifications([
          project.createSpecification(workerPath),
        ]);
        progress?.stop('Dataset generation finished');
        const runErrors = [
          ...run.testModules.flatMap((module) =>
            module.errors().map((error) => error.message)
          ),
          ...run.unhandledErrors.map((error) =>
            error instanceof Error ? error.message : String(error)
          ),
        ];
        if (runErrors.length) logger.error(runErrors.join('\n'));
        if (runErrors.length || run.testModules.some((module) => !module.ok()))
          process.exitCode = 1;

        const values = [...outcomes.values()];
        const results = {
          failures: values.filter((outcome) => outcome.kind === 'failed'),
          skipped: values.filter((outcome) => outcome.kind === 'skipped'),
          successes: values.filter((outcome) => outcome.kind === 'generated'),
        };

        if (results.failures.length > 0) {
          if (argv.verbose) {
            logger.error(
              [
                `Failed to generate ${results.failures.length} datasets:`,
                '\n\n',
                ...results.failures.map(
                  (f) => `  ${colors.red('>')} ${f.name}: ${f.error}`
                ),
                '\n',
              ].join('')
            );
          } else {
            logger.error(
              `Failed to generate ${results.failures.length} datasets: ${results.failures.map((f) => f.name).join(', ')}`
            );
          }

          logger.info(
            `Successfully generated ${results.successes.length} datasets`
          );
        } else {
          logger.info(
            `Skipped ${results.skipped.length} datasets as they already exist`
          );
          logger.success(`Generated ${results.successes.length} datasets`);
        }
        logger.newline();
        if (results.failures.length > 0) {
          process.exitCode = 1;
        }
      } finally {
        progress?.stop();
        try {
          await vitest.close();
        } finally {
          if (workerPath) await rm(workerPath, { force: true });
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logger.error(`Failed to generate datasets: ${err.message}`);
      logger.newline();
      process.exitCode = 1;
    }
  },
});

interface DatasetOutcome extends TestArtifactBase {
  type: 'viteval:dataset';
  name: string;
  kind: 'generated' | 'skipped' | 'failed';
  error?: string;
}

declare module 'vitest' {
  interface TaskMeta {
    vitevalDataset?: true;
  }
  interface TestArtifactRegistry {
    'viteval:dataset': DatasetOutcome;
  }
}

function isDatasetOutcome(value: unknown): value is DatasetOutcome {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    value.type === 'viteval:dataset' &&
    'name' in value &&
    typeof value.name === 'string' &&
    'kind' in value &&
    (value.kind === 'generated' ||
      value.kind === 'skipped' ||
      value.kind === 'failed')
  );
}
