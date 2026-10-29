import { isFiniteNumber } from 'massaman/predicate';
import type {
  StoredEvalConfig,
  StoredEvalResult,
  StoredEvalRun,
  StoredEvalSummary,
} from '@viteval/core';
import { serializeJson } from '@viteval/internal';

/** Validate a persisted provider record before using its fields.
 * @param value - Untrusted API metadata.
 * @returns The validated record.
 * @example const metadata = requireRecord(response.metadata);
 */
export function requireRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid provider metadata record');
  return Object.fromEntries(Object.entries(value));
}

/** Decode a remote run snapshot without trusting metadata casts.
 * @param value - JSON snapshot stored by Viteval.
 * @returns A validated run with restored dates.
 * @example const run = decodeRun(metadata.viteval_run);
 */
export function decodeRun(value: unknown): StoredEvalRun {
  const data = requireRecord(
    typeof value === 'string' ? JSON.parse(value) : value
  );
  const config = requireRecord(data.config);
  if (
    typeof data.id !== 'string' ||
    typeof data.name !== 'string' ||
    !isRunStatus(data.status) ||
    !isAggregation(config.aggregation) ||
    !isFiniteNumber(config.threshold) ||
    !Array.isArray(config.scorerNames) ||
    !config.scorerNames.every(
      (name): name is string => typeof name === 'string'
    )
  ) {
    throw new Error('Invalid provider run snapshot');
  }
  const validatedConfig: StoredEvalConfig = {
    aggregation: config.aggregation,
    threshold: config.threshold,
    scorerNames: config.scorerNames,
    timeout: isFiniteNumber(config.timeout) ? config.timeout : undefined,
  };
  return {
    id: data.id,
    name: data.name,
    status: data.status,
    config: validatedConfig,
    datasetId: typeof data.datasetId === 'string' ? data.datasetId : undefined,
    metadata: requireRecord(data.metadata),
    startedAt: requireDate(data.startedAt),
    completedAt:
      data.completedAt === undefined
        ? undefined
        : requireDate(data.completedAt),
    summary:
      data.summary === undefined ? undefined : decodeSummary(data.summary),
  };
}

/** Decode a persisted case outcome.
 * @param value - Untrusted serialized case metadata.
 * @returns A validated outcome.
 * @example const result = decodeResult(metadata.viteval_result);
 */
export function decodeResult(value: unknown): StoredEvalResult {
  const data = requireRecord(
    typeof value === 'string' ? JSON.parse(value) : value
  );
  if (
    typeof data.id !== 'string' ||
    typeof data.evalRunId !== 'string' ||
    typeof data.passed !== 'boolean' ||
    !isFiniteNumber(data.meanScore) ||
    !isFiniteNumber(data.medianScore) ||
    !isFiniteNumber(data.sumScore) ||
    !Array.isArray(data.scores)
  ) {
    throw new Error('Invalid provider result snapshot');
  }
  return {
    id: data.id,
    evalRunId: data.evalRunId,
    passed: data.passed,
    input: data.input,
    expected: data.expected,
    output: data.output,
    meanScore: data.meanScore,
    medianScore: data.medianScore,
    sumScore: data.sumScore,
    duration: isFiniteNumber(data.duration) ? data.duration : undefined,
    metadata: requireRecord(data.metadata),
    scores: data.scores.map((value) => {
      const score = requireRecord(value);
      if (typeof score.name !== 'string' || !isFiniteNumber(score.score))
        throw new Error('Invalid provider score snapshot');
      return {
        name: score.name,
        score: score.score,
        metadata:
          score.metadata === undefined
            ? undefined
            : requireRecord(score.metadata),
      };
    }),
  };
}

/** Validate JSON before sending it to a remote SDK.
 * @param value - Inputs, outputs, or metadata.
 * @returns A JSON-compatible value with dates normalized.
 * @example const input = jsonValue(params.input);
 */
export function jsonValue(value: unknown): unknown {
  return JSON.parse(serializeJson(value));
}

function isRunStatus(value: unknown): value is StoredEvalRun['status'] {
  return value === 'running' || value === 'completed' || value === 'failed';
}
function isAggregation(
  value: unknown
): value is StoredEvalConfig['aggregation'] {
  return value === 'mean' || value === 'median' || value === 'sum';
}
function requireDate(value: unknown): Date {
  if (typeof value !== 'string' || !isFiniteNumber(Date.parse(value)))
    throw new Error('Invalid provider timestamp');
  return new Date(value);
}
function decodeSummary(value: unknown): StoredEvalSummary {
  const summary = requireRecord(value);
  if (
    !isFiniteNumber(summary.meanScore) ||
    !isFiniteNumber(summary.medianScore) ||
    !isFiniteNumber(summary.sumScore) ||
    !isFiniteNumber(summary.passedCount) ||
    !isFiniteNumber(summary.failedCount) ||
    !isFiniteNumber(summary.totalCount) ||
    typeof summary.passed !== 'boolean'
  ) {
    throw new Error('Invalid provider summary snapshot');
  }
  return {
    meanScore: summary.meanScore,
    medianScore: summary.medianScore,
    sumScore: summary.sumScore,
    passedCount: summary.passedCount,
    failedCount: summary.failedCount,
    totalCount: summary.totalCount,
    passed: summary.passed,
  };
}
