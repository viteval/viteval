import { z } from 'zod';

const score = z.object({
  name: z.string(),
  score: z.number().finite(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export const EVAL_RESULTS_SCHEMA = z.object({
  schemaVersion: z.literal(1),
  errors: z.array(z.string()).optional(),
  runId: z.string(),
  runName: z.string(),
  status: z.enum(['running', 'finished']),
  success: z.boolean(),
  numTotalEvalSuites: z.number().int().nonnegative(),
  numPassedEvalSuites: z.number().int().nonnegative(),
  numFailedEvalSuites: z.number().int().nonnegative(),
  numTotalEvals: z.number().int().nonnegative(),
  numPassedEvals: z.number().int().nonnegative(),
  numFailedEvals: z.number().int().nonnegative(),
  numSkippedEvals: z.number().int().nonnegative().default(0),
  startTime: z.number().finite(),
  endTime: z.number().finite().optional(),
  duration: z.number().finite().optional(),
  evalResults: z.array(
    z.object({
      name: z.string(),
      projectName: z.string().optional(),
      filepath: z.string().default(''),
      status: z.enum(['passed', 'failed']),
      startTime: z.number().finite(),
      endTime: z.number().finite(),
      duration: z.number().finite(),
      message: z.string().optional(),
      summary: z.object({
        meanScore: z.number().finite(),
        medianScore: z.number().finite(),
        sumScore: z.number().finite(),
        passedCount: z.number().int().nonnegative(),
        totalCount: z.number().int().nonnegative(),
        failedCount: z.number().int().nonnegative().optional(),
        skippedCount: z.number().int().nonnegative().optional(),
      }),
      evalResults: z.array(
        z.object({
          id: z.string(),
          state: z.enum(['passed', 'failed', 'skipped']),
          error: z.string().optional(),
          name: z.string(),
          mean: z.number().finite(),
          median: z.number().finite(),
          sum: z.number().finite(),
          threshold: z.number().finite(),
          aggregation: z.enum(['mean', 'median', 'sum']),
          scores: z.array(score),
          input: z.unknown().optional(),
          expected: z.unknown().optional(),
          output: z.unknown().optional(),
          metadata: z.record(z.string(), z.unknown()).optional(),
        })
      ),
    })
  ),
});
