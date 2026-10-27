import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { glob } from 'glob';
import { command } from 'maltty';
import { type Reporter, createVitest } from 'vitest/node';
import { createRunnerConfig } from '@viteval/core/config';
import { resolveProjectConfig } from '#/lib/config';
import type { TestArtifactBase } from 'vitest';
import { createDatasetWorker } from '#/commands/data/worker';
import {
  createDatasetBootstrap,
  instrumentDatasetModule,
  normalizeDatasetPath,
} from '#/commands/data/bootstrap';
import {
  DATA_ARGS,
  DATA_OPTIONS,
  DATA_POSITIONALS,
} from '#/lib/command-options';

export const dataCommand = command({
  description: 'Generate the datasets in your codebase',
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
    let matchedFiles = new Set<string>();
    const checkpoint = `__viteval_dataset_${randomUUID().replaceAll('-', '')}`;
    const selectedConfig = resolveProjectConfig(argv);
    const runnerConfig = createRunnerConfig(selectedConfig);
    try {
      const vitest = await createVitest(
        {
          config: selectedConfig.configFile ?? false,
          root: selectedConfig.root,
          run: true,
          watch: false,
          testNamePattern: '^viteval dataset: ',
          reporters: [reporter],
        },
        {
          plugins: [
            ...(runnerConfig.plugins ?? []),
            {
              name: 'viteval-dataset-discovery',
              enforce: 'post',
              transform(code, id) {
                const file = normalizeDatasetPath(id.split('?')[0] ?? '');
                if (!file || !matchedFiles.has(file)) return;
                return {
                  code: instrumentDatasetModule({ code, file, checkpoint }),
                  map: null,
                };
              },
            },
          ],
        }
      );

      let workerPath: string | undefined;
      let bootstrapPath: string | undefined;
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
        matchedFiles = new Set(
          datasets.map((file) =>
            normalizeDatasetPath(path.resolve(rootPath, file))
          )
        );

        workerPath = path.join(
          rootPath,
          '.viteval',
          `.data-${randomUUID()}.test.mjs`
        );
        await mkdir(path.dirname(workerPath), { recursive: true });
        bootstrapPath = workerPath.replace('.test.mjs', '.setup.mjs');
        await writeFile(bootstrapPath, createDatasetBootstrap(), {
          flag: 'wx',
        });
        project.config = {
          ...project.config,
          isolate: true,
          setupFiles: [bootstrapPath, ...project.config.setupFiles],
          sequence: { ...project.config.sequence, setupFiles: 'list' },
          tags: [...project.config.tags, { name: 'viteval-dataset' }],
        };
        await writeFile(
          workerPath,
          createDatasetWorker({
            files: datasets.map((file) => path.resolve(rootPath, file)),
            root: rootPath,
            overwrite: argv.overwrite,
            bootstrap: bootstrapPath,
          }),
          { flag: 'wx' }
        );
        const run = await vitest.runTestSpecifications([
          project.createSpecification(workerPath, {
            testTagsFilter: ['viteval-dataset'],
          }),
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
          if (bootstrapPath) await rm(bootstrapPath, { force: true });
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logger.error(`Failed to generate datasets: ${err.message}`);
      logger.newline();
      process.exitCode = 1;
    }
  },
  options: DATA_OPTIONS,
  positionals: DATA_POSITIONALS,
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
