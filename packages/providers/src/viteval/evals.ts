import { createId } from '@paralleldrive/cuid2';
import { attemptAsync } from 'massaman/control';
import type {
  EvalProvider,
  StoredEvalResult,
  StoredEvalRun,
} from '@viteval/core';
import { serializeJson } from '@viteval/internal';
import type { DatabaseClient } from './db';

/**
 * Create eval run operations backed by Prisma.
 *
 * @param prisma - The Prisma client instance.
 * @returns An EvalProvider implementation.
 *
 * @example
 * ```ts
 * const evalOps = createEvalOps(prisma);
 * const run = await evalOps.create({ name: 'my-eval' });
 * ```
 */
export function createEvalOps(prisma: DatabaseClient): EvalProvider {
  return {
    addResult: (params) =>
      attemptAsync(async () => {
        const result = await prisma.evalRunResult.create({
          data: {
            duration: params.duration,
            evalRunId: params.evalRunId,
            expected: serializeJson(params.expected ?? null),
            id: createId(),
            input: serializeJson(params.input ?? null),
            meanScore: params.meanScore,
            medianScore: params.medianScore,
            metadata: serializeJson(params.metadata ?? {}),
            output: serializeJson(params.output ?? null),
            passed: params.passed,
            scores: serializeJson(params.scores),
            sumScore: params.sumScore,
          },
        });

        return mapEvalResult(result);
      }),

    addResults: (paramsList) =>
      attemptAsync(async () => {
        const data = paramsList.map((params) => ({
          duration: params.duration,
          evalRunId: params.evalRunId,
          expected: serializeJson(params.expected ?? null),
          id: createId(),
          input: serializeJson(params.input ?? null),
          meanScore: params.meanScore,
          medianScore: params.medianScore,
          metadata: serializeJson(params.metadata ?? {}),
          output: serializeJson(params.output ?? null),
          passed: params.passed,
          scores: serializeJson(params.scores),
          sumScore: params.sumScore,
        }));

        await prisma.evalRunResult.createMany({ data });

        // IDs are generated client-side, so reconstruct records directly
        // Instead of re-fetching from the database.
        return data.map((d) => ({
          duration: d.duration,
          evalRunId: d.evalRunId,
          expected: JSON.parse(d.expected) as unknown,
          id: d.id,
          input: JSON.parse(d.input) as unknown,
          meanScore: d.meanScore,
          medianScore: d.medianScore,
          metadata: JSON.parse(d.metadata) as Record<string, unknown>,
          output: JSON.parse(d.output) as unknown,
          passed: d.passed,
          scores: JSON.parse(d.scores),
          sumScore: d.sumScore,
        }));
      }),

    complete: (params) =>
      attemptAsync(async () => {
        const run = await prisma.evalRun.update({
          data: {
            completedAt: new Date(),
            status: params.status ?? 'completed',
            summary: serializeJson(params.summary),
          },
          where: { id: params.id },
        });

        return mapEvalRun(run);
      }),

    create: (params) =>
      attemptAsync(async () => {
        const run = await prisma.evalRun.create({
          data: {
            config: serializeJson(params.config),
            datasetId: params.datasetId,
            id: createId(),
            metadata: serializeJson(params.metadata ?? {}),
            name: params.name,
          },
        });

        return mapEvalRun(run);
      }),

    get: (params) =>
      attemptAsync(async () => {
        const run = await prisma.evalRun.findUnique({
          include: params.includeResults ? { results: true } : undefined,
          where: { id: params.id },
        });

        if (!run) {
          return null;
        }

        const mapped = mapEvalRun(run);

        if (
          params.includeResults &&
          'results' in run &&
          Array.isArray(run.results)
        ) {
          mapped.results = run.results.map(mapEvalResult);
        }

        return mapped;
      }),

    list: (params) =>
      attemptAsync(async () => {
        const runs = await prisma.evalRun.findMany({
          orderBy: { startedAt: 'desc' },
          skip: params?.offset,
          take: params?.limit,
          where: {
            datasetId: params?.datasetId,
            status: params?.status,
          },
        });

        return runs.map(mapEvalRun);
      }),
  };
}

/*
|------------------
| Internals
|------------------
*/

function mapEvalRun(row: {
  id: string;
  name: string;
  datasetId: string | null;
  status: string;
  config: string;
  summary: string | null;
  metadata: string;
  startedAt: Date;
  completedAt: Date | null;
}): StoredEvalRun {
  return {
    completedAt: row.completedAt ?? undefined,
    config: JSON.parse(row.config),
    datasetId: row.datasetId ?? undefined,
    id: row.id,
    metadata: JSON.parse(row.metadata) as Record<string, unknown>,
    name: row.name,
    startedAt: row.startedAt,
    status: parseEvalRunStatus(row.status),
    summary: row.summary ? JSON.parse(row.summary) : undefined,
  };
}

function mapEvalResult(row: {
  id: string;
  evalRunId: string;
  input: string;
  expected: string;
  output: string;
  scores: string;
  meanScore: number;
  medianScore: number;
  sumScore: number;
  passed: boolean;
  duration: number | null;
  metadata: string;
}): StoredEvalResult {
  return {
    duration: row.duration ?? undefined,
    evalRunId: row.evalRunId,
    expected: JSON.parse(row.expected) as unknown,
    id: row.id,
    input: JSON.parse(row.input) as unknown,
    meanScore: row.meanScore,
    medianScore: row.medianScore,
    metadata: JSON.parse(row.metadata) as Record<string, unknown>,
    output: JSON.parse(row.output) as unknown,
    passed: row.passed,
    scores: JSON.parse(row.scores),
    sumScore: row.sumScore,
  };
}

const VALID_EVAL_RUN_STATUSES = ['running', 'completed', 'failed'] as const;
type EvalRunStatus = (typeof VALID_EVAL_RUN_STATUSES)[number];

function parseEvalRunStatus(value: string): EvalRunStatus {
  if (VALID_EVAL_RUN_STATUSES.includes(value as EvalRunStatus)) {
    return value as EvalRunStatus;
  }
  return 'failed';
}
