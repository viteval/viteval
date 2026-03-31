import fs from 'node:fs';
import path from 'node:path';
import { match } from 'ts-pattern';
import type {
  Reporter,
  SerializedError,
  TestCase,
  TestModule,
  TestRunEndReason,
  Vitest,
} from 'vitest/node';
import type { EvalResult } from '#/types';

/**
 * JSON output format for LLM evaluation results
 */
export interface JsonEvalResults {
  /**
   * Status of the evaluation run
   */
  status: 'running' | 'finished';
  /**
   * Whether all evaluations passed their thresholds
   */
  success: boolean;
  /**
   * Number of total evaluation suites run
   */
  numTotalEvalSuites: number;
  /**
   * Number of evaluation suites that passed
   */
  numPassedEvalSuites: number;
  /**
   * Number of evaluation suites that failed
   */
  numFailedEvalSuites: number;
  /**
   * Number of total individual evaluations
   */
  numTotalEvals: number;
  /**
   * Number of individual evaluations that passed
   */
  numPassedEvals: number;
  /**
   * Number of individual evaluations that failed
   */
  numFailedEvals: number;
  /**
   * Timestamp when evaluation started
   */
  startTime: number;
  /**
   * Timestamp when evaluation ended
   */
  endTime?: number;
  /**
   * Total duration of evaluation in milliseconds
   */
  duration?: number;
  /**
   * Results for each evaluation suite
   */
  evalResults: JsonEvalSuite[];
}

/**
 * JSON format for an evaluation suite result
 */
export interface JsonEvalSuite {
  /**
   * Name of the evaluation suite
   */
  name: string;
  /**
   * Filepath of the evaluation suite
   */
  filepath: string;
  /**
   * Whether the suite passed (all evals met threshold)
   */
  status: 'passed' | 'failed';
  /**
   * Timestamp when suite started
   */
  startTime: number;
  /**
   * Timestamp when suite ended
   */
  endTime: number;
  /**
   * Duration of the suite in milliseconds
   */
  duration: number;
  /**
   * Individual evaluation results within this suite
   */
  evalResults: EvalResult[];
  /**
   * Error message if suite failed
   */
  message?: string;
  /**
   * Suite-level aggregated metrics
   */
  summary: {
    /**
     * Overall mean score across all evals in suite
     */
    meanScore: number;
    /**
     * Overall median score across all evals in suite
     */
    medianScore: number;
    /**
     * Overall sum score across all evals in suite
     */
    sumScore: number;
    /**
     * Number of evals that passed threshold
     */
    passedCount: number;
    /**
     * Total number of evals
     */
    totalCount: number;
  };
}

/**
 * Params for constructing a JsonReporter
 */
interface JsonReporterOptions {
  outputFile?: string;
}

/**
 * Collected eval results keyed by suite identifier (parent suite name or module ID)
 */
interface SuiteAccumulator {
  name: string;
  moduleId: string;
  evalResults: EvalResult[];
  hasFailedTests: boolean;
  startTime: number;
  endTime: number;
  errorMessages: string[];
}

/**
 * JSON reporter for LLM evaluations
 *
 * Collects evaluation results from test case metadata using Vitest v4's
 * granular Reporter API and outputs comprehensive JSON format suitable
 * for UI generation and analysis.
 *
 * @example
 * ```ts
 * // vitest.config.ts
 * export default defineConfig({
 *   test: {
 *     reporters: [
 *       'default',
 *       ['@viteval/core/reporters/json', { outputFile: 'eval-results.json' }]
 *     ]
 *   }
 * });
 * ```
 */
export default class JsonReporter implements Reporter {
  private results: JsonEvalResults;
  private outputFile: string | null;
  private suiteAccumulators: Map<string, SuiteAccumulator>;

  constructor(options: JsonReporterOptions = {}) {
    this.outputFile = options.outputFile || null;
    this.suiteAccumulators = new Map();
    this.results = {
      evalResults: [],
      numFailedEvalSuites: 0,
      numFailedEvals: 0,
      numPassedEvalSuites: 0,
      numPassedEvals: 0,
      numTotalEvalSuites: 0,
      numTotalEvals: 0,
      startTime: Date.now(),
      status: 'running',
      success: true,
    };
  }

  /**
   * Called when Vitest is initialized. Stores a reference and sets the start time.
   *
   * @param vitest - The Vitest instance
   */
  onInit(_vitest: Vitest) {
    this.results.startTime = Date.now();
    this.results.status = 'running';

    // Write initial file with 'running' status
    this.writeResults();
  }

  /**
   * Called after each test case finishes. Reads evalResult from task meta
   * and accumulates it into the appropriate suite bucket.
   *
   * @param testCase - The completed test case
   */
  onTestCaseResult(testCase: TestCase) {
    const { evalResult } = testCase.meta();
    if (!evalResult) {
      return;
    }

    const suiteKey = getSuiteKey(testCase);
    const accumulator = this.getOrCreateAccumulator(testCase, suiteKey);
    accumulator.evalResults.push(evalResult);

    const testResult = testCase.result();
    if (testResult.state === 'failed') {
      accumulator.hasFailedTests = true;
      if (testResult.errors) {
        for (const err of testResult.errors) {
          accumulator.errorMessages.push(err.message);
        }
      }
    }

    const diagnostic = testCase.diagnostic();
    if (diagnostic) {
      const testEndTime = diagnostic.startTime + diagnostic.duration;
      if (testEndTime > accumulator.endTime) {
        accumulator.endTime = testEndTime;
      }
      if (diagnostic.startTime < accumulator.startTime) {
        accumulator.startTime = diagnostic.startTime;
      }
    }
  }

  /**
   * Called when a test module finishes. Writes incremental output so
   * consumers can see partial results.
   *
   * @param _testModule - The completed test module
   */
  onTestModuleEnd(_testModule: TestModule) {
    this.writeResults();
  }

  /**
   * Called when the entire test run ends. Finalizes all suite accumulators
   * into the output format and writes the final results.
   *
   * @param _testModules - All test modules from the run
   * @param _unhandledErrors - Unhandled errors during the run
   * @param _reason - Why the run ended (passed, failed, interrupted)
   */
  onTestRunEnd(
    _testModules: readonly TestModule[],
    unhandledErrors: readonly SerializedError[],
    reason: TestRunEndReason
  ) {
    this.results.endTime = Date.now();
    this.results.duration = this.results.endTime - this.results.startTime;
    this.results.status = 'finished';

    // Reset aggregated results before finalizing
    this.results.evalResults = [];
    this.results.numTotalEvalSuites = 0;
    this.results.numPassedEvalSuites = 0;
    this.results.numFailedEvalSuites = 0;
    this.results.numTotalEvals = 0;
    this.results.numPassedEvals = 0;
    this.results.numFailedEvals = 0;

    for (const accumulator of this.suiteAccumulators.values()) {
      if (accumulator.evalResults.length === 0) {
        continue;
      }

      this.results.numTotalEvalSuites++;
      this.results.numTotalEvals += accumulator.evalResults.length;

      const summary = calculateSuiteSummary(accumulator.evalResults);
      const suitePassed =
        !accumulator.hasFailedTests &&
        isAllThresholdsMet(accumulator.evalResults);

      if (suitePassed) {
        this.results.numPassedEvalSuites++;
      } else {
        this.results.numFailedEvalSuites++;
      }

      this.results.numPassedEvals += summary.passedCount;
      this.results.numFailedEvals += summary.totalCount - summary.passedCount;

      const duration = accumulator.endTime - accumulator.startTime;

      const suiteResult: JsonEvalSuite = {
        duration,
        endTime: accumulator.endTime,
        evalResults: accumulator.evalResults,
        filepath: path.relative(process.cwd(), accumulator.moduleId),
        message:
          accumulator.errorMessages.length > 0
            ? accumulator.errorMessages.join('\n')
            : undefined,
        name: accumulator.name,
        startTime: accumulator.startTime,
        status: suitePassed ? 'passed' : 'failed',
        summary,
      };

      this.results.evalResults.push(suiteResult);
    }

    this.results.success =
      reason === 'passed' &&
      unhandledErrors.length === 0 &&
      this.results.numFailedEvalSuites === 0;

    this.writeResults();
  }

  private getOrCreateAccumulator(
    testCase: TestCase,
    suiteKey: string
  ): SuiteAccumulator {
    const existing = this.suiteAccumulators.get(suiteKey);
    if (existing) {
      return existing;
    }

    const suiteName = getSuiteName(testCase);
    const now = Date.now();

    const accumulator: SuiteAccumulator = {
      endTime: now,
      errorMessages: [],
      evalResults: [],
      hasFailedTests: false,
      moduleId: testCase.module.moduleId,
      name: suiteName,
      startTime: now,
    };

    this.suiteAccumulators.set(suiteKey, accumulator);
    return accumulator;
  }

  private writeResults() {
    try {
      const output = JSON.stringify(this.results, null, 2);

      if (this.outputFile) {
        const outputPath = path.resolve(this.outputFile);

        // Ensure directory exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(outputPath, output);
      } else {
        process.stdout.write(output);
        process.stdout.write('\n');
      }
    } catch (error) {
      throw new Error(`Failed to write evaluation results: ${error}`, {
        cause: error,
      });
    }
  }
}

/*
|------------------
| Internals
|------------------
*/

function getSuiteKey(testCase: TestCase): string {
  const { parent } = testCase;
  if (parent.type === 'suite') {
    return `${testCase.module.moduleId}::${parent.id}`;
  }
  return testCase.module.moduleId;
}

function getSuiteName(testCase: TestCase): string {
  const { parent } = testCase;
  if (parent.type === 'suite') {
    return parent.name;
  }
  return testCase.module.moduleId;
}

function getAggregatedScore(result: EvalResult): number {
  return match(result.aggregation)
    .with('mean', () => result.mean)
    .with('median', () => result.median)
    .with('sum', () => result.sum)
    .exhaustive();
}

function calculateSuiteSummary(evalResults: EvalResult[]) {
  const totalCount = evalResults.length;
  let passedCount = 0;
  let totalMean = 0;
  let totalMedian = 0;
  let totalSum = 0;

  for (const result of evalResults) {
    totalMean += result.mean;
    totalMedian += result.median;
    totalSum += result.sum;

    if (getAggregatedScore(result) >= result.threshold) {
      passedCount++;
    }
  }

  return {
    meanScore: totalCount > 0 ? totalMean / totalCount : 0,
    medianScore: totalCount > 0 ? totalMedian / totalCount : 0,
    passedCount,
    sumScore: totalSum,
    totalCount,
  };
}

function isAllThresholdsMet(evalResults: EvalResult[]): boolean {
  return evalResults.every(
    (result) => getAggregatedScore(result) >= result.threshold
  );
}
