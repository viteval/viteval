import path from 'node:path';
import { createId } from '@paralleldrive/cuid2';
import { humanId } from 'human-id';
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
import { getMedianScore } from '#/scorer/aggregation';

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
  let outputPath: string | null = null;

  return {
    onInit(vitest: Vitest) {
      root = vitest.config.root;
    },
    onTestRunStart() {
      results = createResults(
        iteration++ === 0
          ? { id: results.runId, name: results.runName }
          : createRunIdentity()
      );
      outputPath = null;
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
        ...(reason === 'interrupted' ? ['Evaluation run interrupted'] : []),
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

    outputPath =
      outputPath ??
      path.resolve(
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
  const suites = new Map<string, SuiteProjection>();

  for (const testModule of testModules) {
    const testCases = Array.from(testModule.children.allTests()).filter(
      (testCase) => testCase.meta().viteval === true
    );
    for (const testCase of testCases) {
      const suite = getOrCreateSuite(suites, testCase);
      const result = testCase.result();
      suite.totalTests++;

      if (result.state === 'passed') {
        suite.passedTests++;
      } else if (result.state === 'failed') {
        suite.failedTests++;
        suite.errorMessages.push(
          ...result.errors.map((error) => error.message)
        );
      } else if (result.state === 'skipped') {
        suite.skippedTests++;
      }

      suite.hasFailed ||=
        !testCase.ok() ||
        (testCase.parent.type === 'suite' && !testCase.parent.ok());
      const artifact = testCase.artifacts().findLast(isEvalResultArtifact);
      if (artifact) {
        suite.evalResults.push({
          ...artifact.result,
          id: testCase.id,
          state:
            result.state === 'passed'
              ? 'passed'
              : result.state === 'failed'
                ? 'failed'
                : 'skipped',
          error:
            result.state === 'failed'
              ? result.errors.map((error) => error.message).join('\n')
              : undefined,
        });
      }

      const diagnostic = testCase.diagnostic();
      if (diagnostic) {
        suite.startTime = Math.min(suite.startTime, diagnostic.startTime);
        suite.endTime = Math.max(
          suite.endTime,
          diagnostic.startTime + diagnostic.duration
        );
      }
    }

    const moduleErrors = isEvalModule(testModule, testCases)
      ? testModule.errors()
      : [];
    if (moduleErrors.length > 0) {
      let suite = Array.from(suites.values()).find(
        (candidate) =>
          candidate.moduleId === testModule.moduleId &&
          candidate.projectName === (testModule.project?.name || undefined)
      );
      if (!suite) {
        suite = createModuleProjection(testModule);
        suites.set(getModuleKey(testModule), suite);
      }
      suite.hasFailed = true;
      suite.errorMessages.push(...moduleErrors.map((error) => error.message));
    }
  }

  return suites;
}

function getOrCreateSuite(
  suites: Map<string, SuiteProjection>,
  testCase: TestCase
): SuiteProjection {
  const key = getSuiteKey(testCase);
  const existing = suites.get(key);
  if (existing) {
    return existing;
  }

  const now = Date.now();
  const suiteErrors =
    testCase.parent.type === 'suite'
      ? testCase.parent.errors().map((error) => error.message)
      : [];
  const suite: SuiteProjection = {
    projectName: testCase.module.project?.name || undefined,
    endTime: 0,
    errorMessages: suiteErrors,
    evalResults: [],
    failedTests: 0,
    hasFailed: testCase.parent.type === 'suite' && !testCase.parent.ok(),
    moduleId: testCase.module.moduleId,
    name:
      testCase.parent.type === 'suite'
        ? testCase.parent.name
        : testCase.module.relativeModuleId,
    passedTests: 0,
    skippedTests: 0,
    startTime: now,
    totalTests: 0,
  };
  suites.set(key, suite);
  return suite;
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
    message:
      suite.errorMessages.length > 0
        ? suite.errorMessages.join('\n')
        : undefined,
    name: suite.name,
    startTime: suite.startTime,
    status: suite.hasFailed ? 'failed' : 'passed',
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
  let totalMean = 0;
  let totalSum = 0;

  for (const result of evalResults) {
    totalMean += result.mean;
    totalSum += result.sum;
  }

  return {
    meanScore: evalResults.length > 0 ? totalMean / evalResults.length : 0,
    medianScore: getMedianScore(
      evalResults.map((result) => ({ name: result.name, score: result.median }))
    ),
    passedCount,
    sumScore: totalSum,
    totalCount,
  };
}

function sum(
  suites: Map<string, SuiteProjection>,
  select: (suite: SuiteProjection) => number
) {
  return Array.from(suites.values()).reduce(
    (total, suite) => total + select(suite),
    0
  );
}

function getSuiteKey(testCase: TestCase): string {
  return testCase.parent.type === 'suite'
    ? `${getModuleKey(testCase.module)}::${testCase.parent.id}`
    : getModuleKey(testCase.module);
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
