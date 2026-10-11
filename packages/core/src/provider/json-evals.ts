import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { attemptAsync } from 'massaman/control';
import { z } from 'zod';
import { EVAL_RESULTS_SCHEMA } from '#/reporters/schema';
import type { JsonStore } from './json-store';
import type { EvalProvider, StoredEvalRun } from './types';

const SCORE_SCHEMA = z.object({
  name: z.string(),
  score: z.number().finite(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
const RESULT_SCHEMA = z.object({
  id: z.string(),
  evalRunId: z.string(),
  input: z.unknown(),
  expected: z.unknown(),
  output: z.unknown(),
  scores: z.array(SCORE_SCHEMA),
  meanScore: z.number().finite(),
  medianScore: z.number().finite(),
  sumScore: z.number().finite(),
  passed: z.boolean(),
  duration: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()),
});
const RUN_SCHEMA = z.object({
  id: z.string(),
  name: z.string(),
  datasetId: z.string().optional(),
  status: z.enum(['running', 'completed', 'failed']),
  config: z.object({
    aggregation: z.enum(['mean', 'median', 'sum']),
    threshold: z.number().finite(),
    scorerNames: z.array(z.string()),
    timeout: z.number().optional(),
  }),
  summary: z
    .object({
      meanScore: z.number(),
      medianScore: z.number(),
      sumScore: z.number(),
      passedCount: z.number(),
      failedCount: z.number(),
      totalCount: z.number(),
      passed: z.boolean(),
    })
    .optional(),
  results: z.array(RESULT_SCHEMA).default([]),
  metadata: z.record(z.string(), z.unknown()),
  startedAt: z.coerce.date(),
  completedAt: z.coerce.date().optional(),
});
const FILE_SCHEMA = z.object({
  schemaVersion: z.literal(1),
  providerRun: RUN_SCHEMA,
});

/**
 * Create evaluation persistence over JSON storage.
 * @param store - Project storage.
 * @returns Evaluation provider operations.
 * @example const evals = createJsonEvals(store);
 */
export function createJsonEvals(store: JsonStore): EvalProvider {
  const file = (id: string) => `results/${encodeURIComponent(id)}.json`;
  async function load(id: string) {
    const document = await store.read(file(id), FILE_SCHEMA);
    if (!document) throw new Error(`Evaluation run not found: ${id}`);
    return document.providerRun;
  }
  async function readRun(filename: string): Promise<StoredEvalRun | null> {
    const raw = await store.read(
      `results/${filename}`,
      z.record(z.string(), z.unknown())
    );
    if (!raw) return null;
    if ('providerRun' in raw) return FILE_SCHEMA.parse(raw).providerRun;
    const report = EVAL_RESULTS_SCHEMA.parse(raw);
    const results = report.evalResults.flatMap((suite) =>
      suite.evalResults.map((result, index) => ({
        id: result.id ?? `${report.runId}:${suite.name}:${index}`,
        evalRunId: report.runId,
        input: result.input ?? null,
        expected: result.expected ?? null,
        output: result.output ?? null,
        scores: result.scores,
        meanScore: result.mean,
        medianScore: result.median,
        sumScore: result.sum,
        passed: result.state
          ? result.state === 'passed'
          : !result.metadata?.executionError &&
            (result.aggregation === 'sum'
              ? result.sum
              : result.aggregation === 'median'
                ? result.median
                : result.mean) >= result.threshold,
        metadata: {
          ...result.metadata,
          state: result.state,
          name: result.name,
          suite: suite.name,
          threshold: result.threshold,
          aggregation: result.aggregation,
          error: result.error,
        },
      }))
    );
    const first = report.evalResults[0]?.evalResults[0];
    return {
      id: report.runId,
      name: report.runName,
      status:
        report.status === 'running'
          ? 'running'
          : report.success
            ? 'completed'
            : 'failed',
      config: {
        aggregation: first?.aggregation ?? 'mean',
        threshold: first?.threshold ?? 1,
        scorerNames: first?.scores.map((score) => score.name) ?? [],
      },
      results,
      metadata: {
        suites: report.evalResults.map((suite) => ({
          name: suite.name,
          filepath: suite.filepath,
          status: suite.status,
          message: suite.message,
        })),
        errors: [
          ...(report.errors ?? []),
          ...report.evalResults.flatMap((suite) =>
            suite.message ? [suite.message] : []
          ),
        ],
      },
      startedAt: new Date(report.startTime),
      completedAt:
        report.endTime === undefined ? undefined : new Date(report.endTime),
      summary: {
        meanScore: results.length
          ? results.reduce((sum, result) => sum + result.meanScore, 0) /
            results.length
          : 0,
        medianScore: median(results.map((result) => result.medianScore)),
        sumScore: results.reduce((sum, result) => sum + result.sumScore, 0),
        passedCount: report.numPassedEvals,
        failedCount: report.numFailedEvals,
        totalCount: report.numTotalEvals,
        passed: report.success,
      },
    };
  }
  async function save(run: StoredEvalRun) {
    const results = run.results ?? [];
    const passedCount = results.filter((result) => result.passed).length;
    const endTime = run.completedAt?.getTime();
    const startTime = run.startedAt.getTime();
    const summary = run.summary ?? {
      meanScore: 0,
      medianScore: 0,
      sumScore: 0,
      passedCount,
      failedCount: results.filter(
        (result) => !result.passed && result.metadata.state !== 'skipped'
      ).length,
      totalCount: results.length,
      passed: false,
    };
    const passed = run.status === 'completed' && summary.passed;
    await store.write(file(run.id), {
      schemaVersion: 1,
      providerRun: run,
      runId: run.id,
      runName: run.name,
      status: run.status === 'running' ? 'running' : 'finished',
      success: passed,
      numTotalEvalSuites: 1,
      numPassedEvalSuites: passed ? 1 : 0,
      numFailedEvalSuites: run.status !== 'running' && !passed ? 1 : 0,
      numTotalEvals: summary.totalCount,
      numPassedEvals: summary.passedCount,
      numFailedEvals: summary.failedCount,
      numSkippedEvals:
        summary.totalCount - summary.passedCount - summary.failedCount,
      startTime,
      endTime,
      duration: endTime === undefined ? undefined : endTime - startTime,
      evalResults: [
        {
          name: run.name,
          projectName:
            typeof run.metadata.projectName === 'string'
              ? run.metadata.projectName
              : undefined,
          filepath:
            typeof run.metadata.filepath === 'string'
              ? path.relative(store.root, path.resolve(run.metadata.filepath))
              : '',
          status:
            run.status === 'failed' || run.summary?.passed === false
              ? 'failed'
              : 'passed',
          startTime,
          endTime: endTime ?? startTime,
          duration: (endTime ?? startTime) - startTime,
          message:
            typeof run.metadata.error === 'string'
              ? run.metadata.error
              : results
                  .map((result) => result.metadata.executionError)
                  .filter((error): error is string => typeof error === 'string')
                  .join('\n') || undefined,
          summary: {
            meanScore: summary.meanScore,
            medianScore: summary.medianScore,
            sumScore: summary.sumScore,
            passedCount: summary.passedCount,
            totalCount: summary.totalCount,
            failedCount: summary.failedCount,
            skippedCount:
              summary.totalCount - summary.passedCount - summary.failedCount,
          },
          evalResults: results.map((result) => ({
            id: result.id,
            state:
              result.metadata.state === 'skipped'
                ? 'skipped'
                : result.passed
                  ? 'passed'
                  : 'failed',
            error:
              typeof result.metadata.executionError === 'string'
                ? result.metadata.executionError
                : undefined,
            name:
              typeof result.metadata.name === 'string'
                ? result.metadata.name
                : result.id,
            input: result.input,
            expected: result.expected,
            output: result.output,
            scores: result.scores,
            mean: result.meanScore,
            median: result.medianScore,
            sum: result.sumScore,
            aggregation: run.config.aggregation,
            threshold: run.config.threshold,
            metadata: {
              ...result.metadata,
              id: result.id,
              passed: result.passed,
            },
          })),
        },
      ],
    });
  }
  return {
    create: (params) =>
      attemptAsync(async () => {
        const run: StoredEvalRun = RUN_SCHEMA.parse({
          id: randomUUID(),
          name: params.name,
          datasetId: params.datasetId,
          status: 'running',
          config: params.config,
          metadata: params.metadata ?? {},
          startedAt: new Date(),
          results: [],
        });
        await save(run);
        return run;
      }),
    get: (params) =>
      attemptAsync(async () => {
        const direct = await readRun(`${encodeURIComponent(params.id)}.json`);
        const documents = direct
          ? [direct]
          : await Promise.all((await store.list('results')).map(readRun));
        const run =
          documents.find((candidate) => candidate?.id === params.id) ?? direct;
        return run
          ? { ...run, results: params.includeResults ? run.results : undefined }
          : null;
      }),
    list: (params) =>
      attemptAsync(async () => {
        const documents = await Promise.all(
          (await store.list('results')).map(readRun)
        );
        return documents
          .filter((run) => run !== null)
          .filter(
            (run) =>
              (!params?.datasetId || run.datasetId === params.datasetId) &&
              (!params?.status || run.status === params.status)
          )
          .toSorted((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
          .slice(
            params?.offset ?? 0,
            params?.limit === undefined
              ? undefined
              : (params.offset ?? 0) + params.limit
          );
      }),
    addResult: (params) =>
      attemptAsync(() =>
        store.update(file(params.evalRunId), async () => {
          const run = await load(params.evalRunId);
          if (run.status !== 'running')
            throw new Error(`Run is already finalized: ${run.id}`);
          const result = RESULT_SCHEMA.parse({
            ...params,
            input: params.input ?? null,
            expected: params.expected ?? null,
            output: params.output ?? null,
            id: randomUUID(),
            metadata: params.metadata ?? {},
          });
          await save({ ...run, results: [...run.results, result] });
          return result;
        })
      ),
    complete: (params) =>
      attemptAsync(() =>
        store.update(file(params.id), async () => {
          const run = await load(params.id);
          const next = {
            ...run,
            status: params.status ?? ('completed' as const),
            summary: params.summary,
            completedAt: new Date(),
          };
          await save(next);
          return next;
        })
      ),
  };
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = values.toSorted((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}
