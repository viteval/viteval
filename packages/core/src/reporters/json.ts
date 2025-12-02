import fs from 'node:fs';
import path from 'node:path';
import type { DangerouslyAllowAny } from '@viteval/internal';
import type { Reporter } from 'vitest/reporters';
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
 * JSON reporter for LLM evaluations
 *
 * Collects evaluation results from suite metadata and outputs comprehensive
 * JSON format suitable for UI generation and analysis
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
  private processedSuites: Map<string, JsonEvalSuite>;
  private processedTests: Map<string, EvalResult[]>;

  constructor(options: { outputFile?: string } = {}) {
    this.outputFile = options.outputFile || null;
    this.processedSuites = new Map();
    this.processedTests = new Map();
    this.results = {
      status: 'running',
      success: true,
      numTotalEvalSuites: 0,
      numPassedEvalSuites: 0,
      numFailedEvalSuites: 0,
      numTotalEvals: 0,
      numPassedEvals: 0,
      numFailedEvals: 0,
      startTime: Date.now(),
      evalResults: [],
    };
  }

  onInit() {
    this.results.startTime = Date.now();
    this.results.status = 'running';

    // Write initial file with 'running' status
    this.writeResults();
  }

  onTaskUpdate(packs: DangerouslyAllowAny[]) {
    // Handle individual test completions
    for (const pack of packs) {
      const task = pack[1];
      if (!task) continue;

      // Extract eval results from the task if available
      const evalResults = this.extractTaskEvalResults(task);
      if (evalResults.length > 0) {
        const suiteId = task.file?.filepath || task.suite?.id || 'unknown';

        // Store test results for the suite
        if (!this.processedTests.has(suiteId)) {
          this.processedTests.set(suiteId, []);
        }
        const existingResults = this.processedTests.get(suiteId);
        if (existingResults) {
          existingResults.push(...evalResults);
        }

        // Update incremental results
        this.updateIncrementalResults();
      }
    }
  }

  onTestFinished(test: DangerouslyAllowAny) {
    // Alternative hook for when a test finishes
    const evalResults = this.extractTaskEvalResults(test);
    if (evalResults.length > 0) {
      const suiteId = test.file?.filepath || test.suite?.id || 'unknown';

      // Store test results for the suite
      if (!this.processedTests.has(suiteId)) {
        this.processedTests.set(suiteId, []);
      }
      const existingResults = this.processedTests.get(suiteId);
      if (existingResults) {
        existingResults.push(...evalResults);
      }

      // Update incremental results
      this.updateIncrementalResults();
    }
  }

  onFinished(files: DangerouslyAllowAny[] = []) {
    this.results.endTime = Date.now();
    this.results.duration = this.results.endTime - this.results.startTime;
    this.results.status = 'finished';

    // Process each test file/suite
    for (const file of files) {
      this.processTestSuite(file);
    }

    // Calculate final metrics
    this.results.success = this.results.numFailedEvalSuites === 0;

    // Write final results to file
    if (this.outputFile) {
      this.writeResults();
    }
  }

  private processTestSuite(file: DangerouslyAllowAny) {
    const suiteId = file.filepath;
    const suiteName =
      file.tasks?.[0]?.name || file.name || file.filepath || 'Unknown Suite';
    const startTime = file.result?.startTime || Date.now();
    const endTime = file.result?.endTime || Date.now();
    const duration = endTime - startTime;

    // Get eval results from both suite meta and accumulated test results
    const suiteMetaResults = this.extractEvalResults(file);
    const accumulatedResults = this.processedTests.get(suiteId) || [];

    // Merge results, preferring accumulated results if available
    const evalResults: EvalResult[] =
      accumulatedResults.length > 0 ? accumulatedResults : suiteMetaResults;

    if (evalResults.length === 0) {
      // This might be a regular test suite, not an eval suite
      return;
    }

    // Check if we've already processed this suite
    if (!this.processedSuites.has(suiteId)) {
      this.results.numTotalEvalSuites++;
      this.results.numTotalEvals += evalResults.length;
    } else {
      // Update existing suite - recalculate metrics
      const existingSuite = this.processedSuites.get(suiteId);
      if (!existingSuite) return;
      this.results.numTotalEvals -= existingSuite.evalResults.length;
      this.results.numTotalEvals += evalResults.length;
    }

    // Calculate suite-level metrics
    const summary = this.calculateSuiteSummary(evalResults);
    const suitePassed = this.isSuitePassed(file, evalResults);

    // Update passed/failed counts
    if (this.processedSuites.has(suiteId)) {
      const oldSuite = this.processedSuites.get(suiteId);
      if (!oldSuite) return;
      // Subtract old counts
      if (oldSuite.status === 'passed') {
        this.results.numPassedEvalSuites--;
      } else {
        this.results.numFailedEvalSuites--;
      }
      this.results.numPassedEvals -= oldSuite.summary.passedCount;
      this.results.numFailedEvals -=
        oldSuite.summary.totalCount - oldSuite.summary.passedCount;
    }

    // Add new counts
    if (suitePassed) {
      this.results.numPassedEvalSuites++;
      this.results.numPassedEvals += summary.passedCount;
    } else {
      this.results.numFailedEvalSuites++;
      this.results.numPassedEvals += summary.passedCount;
    }

    this.results.numFailedEvals += summary.totalCount - summary.passedCount;

    const suiteResult: JsonEvalSuite = {
      name: suiteName,
      filepath: path.relative(process.cwd(), file.filepath),
      status: suitePassed ? 'passed' : 'failed',
      startTime,
      endTime,
      duration,
      evalResults,
      summary,
      message: this.extractErrorMessage(file),
    };

    // Store suite result
    this.processedSuites.set(suiteId, suiteResult);

    // Update results array
    this.results.evalResults = Array.from(this.processedSuites.values());

    // Write updated results after each suite completes
    this.writeResults();
  }

  private extractEvalResults(file: DangerouslyAllowAny): EvalResult[] {
    // Try different paths where results might be stored
    const results =
      file.meta?.results ||
      file.result?.meta?.results ||
      file.tasks?.[0]?.meta?.results ||
      [];

    return Array.isArray(results) ? results : [];
  }

  private extractTaskEvalResults(task: DangerouslyAllowAny): EvalResult[] {
    // Extract eval results from a task/test
    const results =
      task.meta?.results ||
      task.result?.meta?.results ||
      task.context?.meta?.results ||
      [];

    return Array.isArray(results) ? results : [];
  }

  private updateIncrementalResults() {
    // Recalculate totals from accumulated results
    let totalEvals = 0;
    let passedEvals = 0;
    let failedEvals = 0;

    // Calculate from accumulated test results
    for (const [_, evalResults] of this.processedTests) {
      totalEvals += evalResults.length;

      for (const result of evalResults) {
        const score =
          result.aggregation === 'mean'
            ? result.mean
            : result.aggregation === 'median'
              ? result.median
              : result.sum;

        if (score >= result.threshold) {
          passedEvals++;
        } else {
          failedEvals++;
        }
      }
    }

    // Update global counts
    this.results.numTotalEvals = totalEvals;
    this.results.numPassedEvals = passedEvals;
    this.results.numFailedEvals = failedEvals;

    // Write incremental results
    this.writeResults();
  }

  private calculateSuiteSummary(evalResults: EvalResult[]) {
    const totalCount = evalResults.length;
    let passedCount = 0;
    let totalMean = 0;
    let totalMedian = 0;
    let totalSum = 0;

    for (const result of evalResults) {
      totalMean += result.mean;
      totalMedian += result.median;
      totalSum += result.sum;

      // Check if eval passed based on its aggregation method and threshold
      const score =
        result.aggregation === 'mean'
          ? result.mean
          : result.aggregation === 'median'
            ? result.median
            : result.sum;

      if (score >= result.threshold) {
        passedCount++;
      }
    }

    return {
      meanScore: totalCount > 0 ? totalMean / totalCount : 0,
      medianScore: totalCount > 0 ? totalMedian / totalCount : 0,
      sumScore: totalSum,
      passedCount,
      totalCount,
    };
  }

  private isSuitePassed(
    file: DangerouslyAllowAny,
    evalResults: EvalResult[]
  ): boolean {
    // Check if any tests failed in this suite
    if (file.result?.state === 'fail') {
      return false;
    }

    // Check if all eval results met their thresholds
    return evalResults.every((result) => {
      const score =
        result.aggregation === 'mean'
          ? result.mean
          : result.aggregation === 'median'
            ? result.median
            : result.sum;
      return score >= result.threshold;
    });
  }

  private extractErrorMessage(file: DangerouslyAllowAny): string | undefined {
    if (file.result?.errors?.length > 0) {
      return file.result.errors
        .map((e: DangerouslyAllowAny) => e.message || e.toString())
        .join('\n');
    }
    return undefined;
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
      throw new Error(`Failed to write evaluation results: ${error}`);
    }
  }
}
