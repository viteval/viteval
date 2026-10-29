import path from 'node:path';
import { createId } from '@paralleldrive/cuid2';
import { humanId } from 'human-id';
import { groupBy } from 'massaman/array';
import { match, P } from 'massaman/match';
import { meanBy, medianBy, sumBy } from 'massaman/math';
import { serializeJson, writeJsonAtomic } from '@viteval/internal';
import type {
  Reporter,
  SerializedError,
  TestCase,
  TestModule,
  TestRunEndReason,
  Vitest,
} from 'vitest/node';
import { isEvalResultArtifact } from '#/evaluate/artifact';
import type { EvalResult } from '#/types';

/** JSON output for a complete evaluation run. */
export interface JsonEvalResults {
  schemaVersion?: 1;
  errors?: string[];
  runId: string;
  runName: string;
  status: 'running' | 'finished';
  success: boolean;
  numTotalEvalSuites: number;
  numPassedEvalSuites: number;
  numFailedEvalSuites: number;
  numTotalEvals: number;
  numPassedEvals: number;
  numFailedEvals: number;
  numSkippedEvals: number;
  startTime: number;
  endTime?: number;
  duration?: number;
  evalResults: JsonEvalSuite[];
}

/** JSON output for one evaluation suite. */
export interface JsonEvalSuite {
  projectName?: string;
  name: string;
  filepath: string;
  status: 'passed' | 'failed';
  startTime: number;
  endTime: number;
  duration: number;
  evalResults: EvalResult[];
  message?: string;
  summary: {
    meanScore: number;
    medianScore: number;
    sumScore: number;
    passedCount: number;
    totalCount: number;
    failedCount?: number;
    skippedCount?: number;
  };
}

/** Options for the Viteval JSON reporter. */
export interface JsonReporterOptions {
  outputFile?: string;
  run?: { id: string; name: string };
}

interface SuiteProjection {
  projectName?: string;
  name: string;
  moduleId: string;
  evalResults: (EvalResult & { id: string })[];
  hasFailed: boolean;
  startTime: number;
  endTime: number;
  errorMessages: string[];
  failedTests: number;
  passedTests: number;
  skippedTests: number;
  totalTests: number;
}

/**
 * Project Viteval artifacts and Vitest's final task state into evaluation JSON.
 *
 * @param options - Output destination and optional run identity.
 * @returns A Vitest reporter with isolated run state.
 * @example
 * ```ts
 * import { createJsonReporter } from '@viteval/core/internal/reporter';
 * import { defineConfig } from 'vitest/config';
 *
 * export default defineConfig({
 *   test: {
 *     reporters: [
 *       'default',
 *       createJsonReporter({ outputFile: '.viteval/results/<run>.json' }),
 *     ],
 *   },
 * });
 * ```
 */
export function createJsonReporter(options: JsonReporterOptions = {}) {
  const run = options.run ?? createRunIdentity();
  const outputFile = options.outputFile ?? null;
  let results = createResults(run);
  let root = process.cwd();
  let iteration = 0;

  return {
    onInit(vitest: Vitest) {
      root = vitest.config.root;
    },
    onTestRunStart() {
      if (iteration === 0) {
        results = createResults({ id: results.runId, name: results.runName });
      } else {
        results = createResults(createRunIdentity());
      }
      iteration += 1;
    },
    onTestRunEnd,
  } satisfies Reporter;

  async function onTestRunEnd(
    testModules: readonly TestModule[],
    unhandledErrors: readonly SerializedError[],
    reason: TestRunEndReason
  ) {
    const endTime = Date.now();
    const suites = collectSuiteProjections(testModules);
    const evalResults = Array.from(suites.values()).map((suite) => {
      const projected = toJsonEvalSuite(suite, root);
      return {
        ...projected,
        evalResults: projected.evalResults.map((result) => ({
          ...result,
          id: `${results.runId}:${result.id}`,
        })),
      };
    });

    results = {
      ...results,
      schemaVersion: 1,
      errors: [
        ...unhandledErrors.map((error) => error.message),
        ...match(reason)
          .with('interrupted', () => ['Evaluation run interrupted'])
          .with(P._, () => [])
          .exhaustive(),
      ],
      duration: endTime - results.startTime,
      endTime,
      evalResults,
      numFailedEvalSuites: evalResults.filter(
        (suite) => suite.status === 'failed'
      ).length,
      numFailedEvals: sum(suites, (suite) => suite.failedTests),
      numPassedEvalSuites: evalResults.filter(
        (suite) => suite.status === 'passed'
      ).length,
      numPassedEvals: sum(suites, (suite) => suite.passedTests),
      numSkippedEvals: sum(suites, (suite) => suite.skippedTests),
      numTotalEvalSuites: evalResults.length,
      numTotalEvals: sum(suites, (suite) => suite.totalTests),
      status: 'finished',
      success:
        reason === 'passed' &&
        unhandledErrors.length === 0 &&
        evalResults.every((suite) => suite.status === 'passed'),
    };

    await writeResults();
  }

  async function writeResults() {
    const output = serializeJson(results);
    if (!outputFile) {
      process.stdout.write(output);
      return;
    }

    const outputPath = path.resolve(
      root,
      outputFile
        .replaceAll('<run>', encodeURIComponent(results.runName))
        .replaceAll('<id>', encodeURIComponent(results.runId))
        .replaceAll('<timestamp>', String(results.startTime))
    );
    await writeJsonAtomic({ filePath: outputPath, value: results });
  }
}

function createResults(run: { id: string; name: string }): JsonEvalResults {
  return {
    evalResults: [],
    numFailedEvalSuites: 0,
    numFailedEvals: 0,
    numPassedEvalSuites: 0,
    numPassedEvals: 0,
    numSkippedEvals: 0,
    numTotalEvalSuites: 0,
    numTotalEvals: 0,
    runId: run.id,
    runName: run.name,
    startTime: Date.now(),
    status: 'running',
    success: true,
  };
}

function collectSuiteProjections(
  testModules: readonly TestModule[]
): Map<string, SuiteProjection> {
  return new Map(
    testModules.flatMap((testModule) => {
      const testCases = Array.from(testModule.children.allTests()).filter(
        (testCase) => testCase.meta().viteval === true
      );
      const suites = Object.entries(groupBy(testCases, getSuiteKey)).map(
        ([key, cases]) => [key, createSuiteProjection(cases)] as const
      );
      const moduleErrors = match(isEvalModule(testModule, testCases))
        .with(true, () => testModule.errors())
        .with(false, () => [])
        .exhaustive();
      if (!moduleErrors.length) {
        return suites;
      }
      const entries = match(Boolean(suites.length))
        .with(true, () => suites)
        .with(false, () => [
          [
            getModuleKey(testModule),
            createModuleProjection(testModule),
          ] as const,
        ])
        .exhaustive();
      return entries.map(([key, suite], index) => {
        if (index !== 0) {
          return [key, suite] as const;
        }
        return [
          key,
          {
            ...suite,
            hasFailed: true,
            errorMessages: [
              ...suite.errorMessages,
              ...moduleErrors.map((error) => error.message),
            ],
          },
        ] as const;
      });
    })
  );
}

function createSuiteProjection(
  testCases: readonly TestCase[]
): SuiteProjection {
  const testCase = testCases[0]!;
  const now = Date.now();
  const suiteErrors = match(testCase.parent)
    .with({ type: 'suite' }, (parent) =>
      parent.errors().map((error) => error.message)
    )
    .with(P._, () => [])
    .exhaustive();
  const results = testCases.map((entry) => entry.result());
  const diagnostics = testCases.flatMap((entry) => {
    const diagnostic = entry.diagnostic();
    if (diagnostic) {
      return [diagnostic];
    }
    return [];
  });
  return {
    projectName: testCase.module.project?.name || undefined,
    endTime: diagnostics.reduce(
      (latest, diagnostic) =>
        Math.max(latest, diagnostic.startTime + diagnostic.duration),
      0
    ),
    errorMessages: [
      ...suiteErrors,
      ...results.flatMap((result) => {
        if (result.state === 'failed') {
          return result.errors.map((error) => error.message);
        }
        return [];
      }),
    ],
    evalResults: testCases.flatMap((entry) => {
      const artifact = entry.artifacts().findLast(isEvalResultArtifact);
      if (!artifact) {
        return [];
      }
      const result = entry.result();
      return [
        {
          ...artifact.result,
          id: entry.id,
          state: match(result.state)
            .with('passed', () => 'passed' as const)
            .with('failed', () => 'failed' as const)
            .with(P._, () => 'skipped' as const)
            .exhaustive(),
          error: match(result)
            .with({ state: 'failed' }, (failure) =>
              failure.errors.map((error) => error.message).join('\n')
            )
            .with(P._, () => undefined)
            .exhaustive(),
        },
      ];
    }),
    failedTests: results.filter((result) => result.state === 'failed').length,
    hasFailed: testCases.some(
      (entry) =>
        !entry.ok() || (entry.parent.type === 'suite' && !entry.parent.ok())
    ),
    moduleId: testCase.module.moduleId,
    name: match(testCase.parent)
      .with({ type: 'suite' }, (parent) => parent.name)
      .with(P._, () => testCase.module.relativeModuleId)
      .exhaustive(),
    passedTests: results.filter((result) => result.state === 'passed').length,
    skippedTests: results.filter((result) => result.state === 'skipped').length,
    startTime: diagnostics.reduce(
      (earliest, diagnostic) => Math.min(earliest, diagnostic.startTime),
      now
    ),
    totalTests: testCases.length,
  };
}

function createModuleProjection(testModule: TestModule): SuiteProjection {
  const endTime = Date.now();
  return {
    projectName: testModule.project?.name || undefined,
    endTime,
    errorMessages: [],
    evalResults: [],
    failedTests: 0,
    hasFailed: true,
    moduleId: testModule.moduleId,
    name: testModule.relativeModuleId,
    passedTests: 0,
    skippedTests: 0,
    startTime: endTime - testModule.diagnostic().duration,
    totalTests: 0,
  };
}

function toJsonEvalSuite(
  suite: SuiteProjection,
  root: string
): JsonEvalSuite & { evalResults: (EvalResult & { id: string })[] } {
  const endTime = Math.max(suite.endTime, suite.startTime);
  return {
    projectName: suite.projectName,
    duration: endTime - suite.startTime,
    endTime,
    evalResults: suite.evalResults,
    filepath: path.relative(root, suite.moduleId),
    message: match(Boolean(suite.errorMessages.length))
      .with(true, () => suite.errorMessages.join('\n'))
      .with(false, () => undefined)
      .exhaustive(),
    name: suite.name,
    startTime: suite.startTime,
    status: match(suite.hasFailed)
      .with(true, () => 'failed' as const)
      .with(false, () => 'passed' as const)
      .exhaustive(),
    summary: {
      ...calculateSuiteSummary(
        suite.evalResults.filter((result) => result.state !== 'skipped'),
        suite.totalTests,
        suite.passedTests
      ),
      failedCount: suite.failedTests,
      skippedCount: suite.skippedTests,
    },
  };
}

function calculateSuiteSummary(
  evalResults: EvalResult[],
  totalCount: number,
  passedCount: number
) {
  return {
    meanScore: match(evalResults)
      .with([], () => 0)
      .otherwise((items) => meanBy(items, (result) => result.mean)),
    medianScore: match(evalResults)
      .with([], () => 0)
      .otherwise((items) => medianBy(items, (result) => result.median)),
    passedCount,
    sumScore: sumBy(evalResults, (result) => result.sum),
    totalCount,
  };
}

function sum(
  suites: Map<string, SuiteProjection>,
  select: (suite: SuiteProjection) => number
) {
  return sumBy(Array.from(suites.values()), select);
}

function getSuiteKey(testCase: TestCase): string {
  if (testCase.parent.type === 'suite') {
    return `${getModuleKey(testCase.module)}::${testCase.parent.id}`;
  }
  return getModuleKey(testCase.module);
}

function getModuleKey(testModule: TestModule): string {
  return JSON.stringify([testModule.project?.name ?? '', testModule.moduleId]);
}

function isEvalModule(testModule: TestModule, testCases: readonly TestCase[]) {
  return (
    testCases.length > 0 ||
    /\.eval\.(?:[cm]?[jt]sx?)$/.test(testModule.moduleId)
  );
}

function createRunIdentity() {
  return {
    id: createId(),
    name: humanId({ capitalize: false, separator: '-' }),
  };
}
