import { createId } from '@paralleldrive/cuid2';
import { withResult } from '@viteval/internal';
import type {
  EvalProvider,
  StoredEvalResult,
  StoredEvalRun,
} from '@viteval/core';
import type { PrismaClient } from '#/generated/client';

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
export function createEvalOps(prisma: PrismaClient): EvalProvider {
  return {
    create: (params) =>
      withResult(async () => {
        const run = await prisma.evalRun.create({
          data: {
            id: createId(),
            name: params.name,
            datasetId: params.datasetId,
            config: JSON.stringify(params.config),
            tags: JSON.stringify(params.tags ?? []),
            metadata: JSON.stringify(params.metadata ?? {}),
          },
        });

        return mapEvalRun(run);
      }),

    get: (params) =>
      withResult(async () => {
        const run = await prisma.evalRun.findUnique({
          where: { id: params.id },
          include: params.includeResults ? { results: true } : undefined,
        });

        if (!run) return null;

        const mapped = mapEvalRun(run);

        if (params.includeResults && 'results' in run && Array.isArray(run.results)) {
          mapped.results = run.results.map(mapEvalResult);
        }

        return mapped;
      }),

    list: (params) =>
      withResult(async () => {
        const runs = await prisma.evalRun.findMany({
          where: {
            datasetId: params?.datasetId,
            status: params?.status,
            ...(params?.tags?.length
              ? {
                  // Filter runs that contain any of the specified tags.
                  // Tags are stored as JSON arrays, so we use string contains.
                  OR: params.tags.map((tag) => ({
                    tags: { contains: JSON.stringify(tag) },
                  })),
                }
              : {}),
          },
          take: params?.limit,
          skip: params?.offset,
          orderBy: { startedAt: 'desc' },
        });

        return runs.map(mapEvalRun);
      }),

    addResult: (params) =>
      withResult(async () => {
        const result = await prisma.evalRunResult.create({
          data: {
            id: createId(),
            evalRunId: params.evalRunId,
            input: JSON.stringify(params.input),
            expected: JSON.stringify(params.expected),
            output: JSON.stringify(params.output),
            scores: JSON.stringify(params.scores),
            meanScore: params.meanScore,
            medianScore: params.medianScore,
            sumScore: params.sumScore,
            passed: params.passed,
            duration: params.duration,
            metadata: JSON.stringify(params.metadata ?? {}),
          },
        });

        return mapEvalResult(result);
      }),

    addResults: (paramsList) =>
      withResult(async () => {
        const data = paramsList.map((params) => ({
          id: createId(),
          evalRunId: params.evalRunId,
          input: JSON.stringify(params.input),
          expected: JSON.stringify(params.expected),
          output: JSON.stringify(params.output),
          scores: JSON.stringify(params.scores),
          meanScore: params.meanScore,
          medianScore: params.medianScore,
          sumScore: params.sumScore,
          passed: params.passed,
          duration: params.duration,
          metadata: JSON.stringify(params.metadata ?? {}),
        }));

        await prisma.evalRunResult.createMany({ data });

        // IDs are generated client-side, so reconstruct records directly
        // instead of re-fetching from the database.
        return data.map((d) => ({
          id: d.id,
          evalRunId: d.evalRunId,
          input: JSON.parse(d.input) as unknown,
          expected: JSON.parse(d.expected) as unknown,
          output: JSON.parse(d.output) as unknown,
          scores: JSON.parse(d.scores),
          meanScore: d.meanScore,
          medianScore: d.medianScore,
          sumScore: d.sumScore,
          passed: d.passed,
          duration: d.duration,
          metadata: JSON.parse(d.metadata) as Record<string, unknown>,
        }));
      }),

    complete: (params) =>
      withResult(async () => {
        const run = await prisma.evalRun.update({
          where: { id: params.id },
          data: {
            status: params.status ?? 'completed',
            summary: JSON.stringify(params.summary),
            completedAt: new Date(),
          },
        });

        return mapEvalRun(run);
      }),
  };
}

/*
|------------------
| Internals
|------------------
*/

function mapEvalRun(
  row: {
    id: string;
    name: string;
    datasetId: string | null;
    status: string;
    config: string;
    summary: string | null;
    tags: string;
    metadata: string;
    startedAt: Date;
    completedAt: Date | null;
  }
): StoredEvalRun {
  return {
    id: row.id,
    name: row.name,
    datasetId: row.datasetId ?? undefined,
    status: row.status as 'running' | 'completed' | 'failed',
    config: JSON.parse(row.config),
    summary: row.summary ? JSON.parse(row.summary) : undefined,
    tags: JSON.parse(row.tags) as string[],
    metadata: JSON.parse(row.metadata) as Record<string, unknown>,
    startedAt: row.startedAt,
    completedAt: row.completedAt ?? undefined,
  };
}

function mapEvalResult(
  row: {
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
  }
): StoredEvalResult {
  return {
    id: row.id,
    evalRunId: row.evalRunId,
    input: JSON.parse(row.input) as unknown,
    expected: JSON.parse(row.expected) as unknown,
    output: JSON.parse(row.output) as unknown,
    scores: JSON.parse(row.scores),
    meanScore: row.meanScore,
    medianScore: row.medianScore,
    sumScore: row.sumScore,
    passed: row.passed,
    duration: row.duration ?? undefined,
    metadata: JSON.parse(row.metadata) as Record<string, unknown>,
  };
}
