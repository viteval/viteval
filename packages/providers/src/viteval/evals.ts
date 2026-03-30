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
    addResult: (params) =>
      withResult(async () => {
        const result = await prisma.evalRunResult.create({
          data: {
            duration: params.duration,
            evalRunId: params.evalRunId,
            expected: JSON.stringify(params.expected),
            id: createId(),
            input: JSON.stringify(params.input),
            meanScore: params.meanScore,
            medianScore: params.medianScore,
            metadata: JSON.stringify(params.metadata ?? {}),
            output: JSON.stringify(params.output),
            passed: params.passed,
            scores: JSON.stringify(params.scores),
            sumScore: params.sumScore,
          },
        });

        return mapEvalResult(result);
      }),

    addResults: (paramsList) =>
      withResult(async () => {
        const data = paramsList.map((params) => ({
          duration: params.duration,
          evalRunId: params.evalRunId,
          expected: JSON.stringify(params.expected),
          id: createId(),
          input: JSON.stringify(params.input),
          meanScore: params.meanScore,
          medianScore: params.medianScore,
          metadata: JSON.stringify(params.metadata ?? {}),
          output: JSON.stringify(params.output),
          passed: params.passed,
          scores: JSON.stringify(params.scores),
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
      withResult(async () => {
        const run = await prisma.evalRun.update({
          data: {
            completedAt: new Date(),
            status: params.status ?? 'completed',
            summary: JSON.stringify(params.summary),
          },
          where: { id: params.id },
        });

        return mapEvalRun(run);
      }),

    create: (params) =>
      withResult(async () => {
        const run = await prisma.evalRun.create({
          data: {
            config: JSON.stringify(params.config),
            datasetId: params.datasetId,
            id: createId(),
            metadata: JSON.stringify(params.metadata ?? {}),
            name: params.name,
            tags: JSON.stringify(params.tags ?? []),
          },
        });

        return mapEvalRun(run);
      }),

    get: (params) =>
      withResult(async () => {
        const run = await prisma.evalRun.findUnique({
          include: params.includeResults ? { results: true } : undefined,
          where: { id: params.id },
        });

        if (!run) {return null;}

        const mapped = mapEvalRun(run);

        if (params.includeResults && 'results' in run && Array.isArray(run.results)) {
          mapped.results = run.results.map(mapEvalResult);
        }

        return mapped;
      }),

    list: (params) =>
      withResult(async () => {
        const runs = await prisma.evalRun.findMany({
          orderBy: { startedAt: 'desc' },
          skip: params?.offset,
          take: params?.limit,
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
    completedAt: row.completedAt ?? undefined,
    config: JSON.parse(row.config),
    datasetId: row.datasetId ?? undefined,
    id: row.id,
    metadata: JSON.parse(row.metadata) as Record<string, unknown>,
    name: row.name,
    startedAt: row.startedAt,
    status: row.status as 'running' | 'completed' | 'failed',
    summary: row.summary ? JSON.parse(row.summary) : undefined,
    tags: JSON.parse(row.tags) as string[],
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
