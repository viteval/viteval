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

  constructor(options: { outputFile?: string } = {}) {
    this.outputFile = options.outputFile || null;
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
    this.writeResults();
  }

  private processTestSuite(file: DangerouslyAllowAny) {
    const suiteName =
      file.tasks?.[0]?.name || file.name || file.filepath || 'Unknown Suite';
    const startTime = file.result?.startTime || Date.now();
    const endTime = file.result?.endTime || Date.now();
    const duration = endTime - startTime;

    // Extract eval results from suite meta
    const evalResults: EvalResult[] = this.extractEvalResults(file);

    if (evalResults.length === 0) {
      // This might be a regular test suite, not an eval suite
      return;
    }

    this.results.numTotalEvalSuites++;
    this.results.numTotalEvals += evalResults.length;

    // Calculate suite-level metrics
    const summary = this.calculateSuiteSummary(evalResults);
    const suitePassed = this.isSuitePassed(file, evalResults);

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

    this.results.evalResults.push(suiteResult);
    
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
