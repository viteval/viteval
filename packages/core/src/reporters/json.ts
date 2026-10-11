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
  evalResults: EvalResult[];
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
 * @example
 * ```ts
 * import { JsonReporter } from 'viteval/reporters';
 * import { defineConfig } from 'vitest/config';
 *
 * export default defineConfig({
 *   test: {
 *     reporters: [
 *       'default',
 *       new JsonReporter({ outputFile: '.viteval/results/<run>.json' }),
 *     ],
 *   },
 * });
 * ```
 */
export default class JsonReporter implements Reporter {
  private results: JsonEvalResults;
  private readonly outputFile: string | null;
  private root = process.cwd();
  private iteration = 0;
  private outputPath: string | null = null;

  constructor(options: JsonReporterOptions = {}) {
    const run = options.run ?? createRunIdentity();
    this.outputFile = options.outputFile ?? null;
    this.results = createResults(run);
  }

  onInit(vitest: Vitest) {
    this.root = vitest.config.root;
  }

  onTestRunStart() {
    this.results = createResults(
      this.iteration++ === 0
        ? {
            id: this.results.runId,
            name: this.results.runName,
          }
        : createRunIdentity()
    );
    this.outputPath = null;
  }

  async onTestRunEnd(
    testModules: readonly TestModule[],
    unhandledErrors: readonly SerializedError[],
    reason: TestRunEndReason
  ) {
    const endTime = Date.now();
    const suites = collectSuiteProjections(testModules);
    const evalResults = Array.from(suites.values()).map((suite) => {
      const projected = toJsonEvalSuite(suite, this.root);
      return {
        ...projected,
        evalResults: projected.evalResults.map((result, index) => ({
          ...result,
          id: `${this.results.runId}:${result.id ?? index}`,
        })),
      };
    });

    this.results = {
      ...this.results,
      schemaVersion: 1,
      errors: [
        ...unhandledErrors.map((error) => error.message),
        ...(reason === 'interrupted' ? ['Evaluation run interrupted'] : []),
      ],
      duration: endTime - this.results.startTime,
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
        reason !== 'interrupted' &&
        unhandledErrors.length === 0 &&
        evalResults.every((suite) => suite.status === 'passed'),
    };

    await this.writeResults();
  }

  private async writeResults() {
    const output = serializeJson(this.results);
    if (!this.outputFile) {
      process.stdout.write(output);
      return;
    }

    const outputPath =
      this.outputPath ??
      path.resolve(
        this.root,
        this.outputFile
          .replaceAll('<run>', encodeURIComponent(this.results.runName))
          .replaceAll('<id>', encodeURIComponent(this.results.runId))
          .replaceAll('<timestamp>', String(this.results.startTime))
      );
    this.outputPath = outputPath;
    await writeJsonAtomic({ filePath: outputPath, value: this.results });
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
        (candidate) => candidate.moduleId === testModule.moduleId
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
    endTime: now,
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

function toJsonEvalSuite(suite: SuiteProjection, root: string): JsonEvalSuite {
  return {
    projectName: suite.projectName,
    duration: suite.endTime - suite.startTime,
    endTime: suite.endTime,
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
        suite.evalResults,
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
    ? `${testCase.module.moduleId}::${testCase.parent.id}`
    : getModuleKey(testCase.module);
}

function getModuleKey(testModule: TestModule): string {
  return testModule.moduleId;
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
