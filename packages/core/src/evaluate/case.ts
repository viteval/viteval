import { serializeJson } from '@viteval/internal';
import { attempt, attemptAsync, err, isErr, ok } from 'massaman/control';
import type { Result } from 'massaman/control';
import { match } from 'massaman/match';
import { isFiniteNumber } from 'massaman/predicate';
import {
  getMeanScore,
  getMedianScore,
  getSumScore,
} from '#/scorer/aggregation';
import type {
  Data,
  DataItem,
  Eval,
  EvalResult,
  InferDataExtra,
  InferDataInput,
  InferDataOutput,
  ScorerAggregationType,
  TaskArgs,
} from '#/types';
import type { EvalOptions } from '#/config/types';

export type NormalizedEvalResult = Omit<EvalResult, 'scores'> & {
  scores: (EvalResult['scores'][number] & { score: number })[];
};

interface RunEvaluationCaseParams<DATA extends Data, OUTPUT> {
  dataItem: DataItem<
    InferDataInput<DATA>,
    InferDataOutput<DATA>,
    InferDataExtra<DATA>
  >;
  name: string;
  task: Eval<DATA, OUTPUT>['task'];
  scorers: Eval<DATA, OUTPUT>['scorers'];
  aggregation: ScorerAggregationType;
  threshold: number;
  signal: AbortSignal;
}

interface FailureResultParams {
  dataItem: DataItem;
  name: string;
  aggregation: ScorerAggregationType;
  threshold: number;
  error: unknown;
}

interface ValidateEvaluationParams extends Pick<
  EvalOptions,
  'timeout' | 'retries'
> {
  threshold: number;
  concurrency: number;
  scorerCount: number;
}

/**
 * Validate resolved execution options without invoking an engine.
 * @param params - Resolved options and number of scorers.
 * @returns The first configuration failure, or success.
 * @example validateEvaluationOptions({ threshold: 1, concurrency: 5, scorerCount: 1 });
 * @internal
 */
export function validateEvaluationOptions({
  threshold,
  concurrency,
  scorerCount,
  timeout,
  retries,
}: ValidateEvaluationParams): Result<void> {
  const checks = [
    {
      valid: isFiniteNumber(threshold),
      message: 'Evaluation threshold must be finite',
    },
    {
      valid: scorerCount > 0,
      message: 'Evaluation requires at least one scorer',
    },
    {
      valid: Number.isSafeInteger(concurrency) && concurrency > 0,
      message: 'Evaluation concurrency must be a positive integer',
    },
    {
      valid: timeout === undefined || (isFiniteNumber(timeout) && timeout > 0),
      message: 'Evaluation timeout must be positive',
    },
    {
      valid:
        retries === undefined ||
        (Number.isSafeInteger(retries) && retries >= 0),
      message: 'Evaluation retries must be a non-negative integer',
    },
  ];
  const invalid = checks.find((check) => !check.valid);
  if (invalid) {
    return err(invalid.message);
  }
  return ok(undefined);
}

/**
 * Execute and score a case independently of any test engine.
 * @param params - Case, functions, scoring policy, and cancellation signal.
 * @returns A scored result, cancellation, or execution failure.
 * @example await runEvaluationCase({ dataItem, name, task, scorers, aggregation: 'mean', threshold: 1, signal });
 * @internal
 */
export async function runEvaluationCase<DATA extends Data, OUTPUT>({
  dataItem,
  name,
  task,
  scorers,
  aggregation,
  threshold,
  signal,
}: RunEvaluationCaseParams<DATA, OUTPUT>): Promise<
  Result<NormalizedEvalResult | undefined>
> {
  if (signal.aborted) {
    return ok(undefined);
  }
  const { input, expected, ...metadata } = dataItem;
  const args = taskArgs<DATA>(dataItem);
  const output = await attemptAsync(async () => {
    serializeJson(dataItem);
    const value = await task(args);
    if (!signal.aborted) {
      serializeJson({ output: value });
    }
    return value;
  });
  if (signal.aborted) {
    return ok(undefined);
  }
  if (isErr(output)) {
    return output;
  }
  const scored = await attemptAsync(() =>
    Promise.all(
      scorers.map(async (scorer) =>
        scorer({ ...args, expected, output: output.value })
      )
    )
  );
  if (signal.aborted) {
    return ok(undefined);
  }
  if (isErr(scored)) {
    return scored;
  }
  const scores = scored.value.map((score, index) => ({
    ...score,
    name: score.name || scorers[index].name,
    score: score.score ?? 0,
  }));
  const invalid = scores.find((score) => !isFiniteNumber(score.score));
  if (invalid) {
    return err(`Scorer ${invalid.name} returned a non-finite score`);
  }
  const result: NormalizedEvalResult = {
    aggregation,
    expected,
    input,
    metadata,
    name,
    output: output.value,
    scores,
    threshold,
    mean: getMeanScore(scores),
    median: getMedianScore(scores),
    sum: getSumScore(scores),
  };
  const serialized = attempt(() => serializeJson(result));
  if (isErr(serialized)) {
    return serialized;
  }
  return ok(result);
}

/**
 * Project an execution failure into a serializable evaluation result.
 * @param params - Case identity, scoring policy, and failure.
 * @returns A result retaining safely serializable inputs and the diagnostic.
 * @example createFailureResult({ dataItem, name, aggregation: 'mean', threshold: 1, error });
 * @internal
 */
export function createFailureResult({
  dataItem,
  name,
  aggregation,
  threshold,
  error,
}: FailureResultParams): NormalizedEvalResult {
  return {
    ...createUnscoredResult({ dataItem, name, aggregation, threshold }),
    metadata: {
      executionError: errorMessage(error),
    },
  };
}

/**
 * Preserve case identity when the engine never executes its task.
 * @param params - Case identity and scoring policy.
 * @returns An unscored, serializable result without an execution diagnostic.
 * @example createUnscoredResult({ dataItem, name, aggregation: 'mean', threshold: 1 });
 * @internal
 */
export function createUnscoredResult({
  dataItem,
  name,
  aggregation,
  threshold,
}: Omit<FailureResultParams, 'error'>): NormalizedEvalResult {
  return {
    aggregation,
    expected: safeJson(dataItem.expected),
    input: safeJson(dataItem.input),
    mean: 0,
    median: 0,
    sum: 0,
    name,
    output: null,
    scores: [],
    threshold,
  };
}

/**
 * Select the configured aggregate from a scored case.
 * @param result - The normalized case result.
 * @returns The aggregate used for threshold gating.
 * @example evaluationScore(result);
 * @internal
 */
export function evaluationScore(result: NormalizedEvalResult): number {
  return match(result.aggregation)
    .with('mean', () => result.mean)
    .with('median', () => result.median)
    .with('sum', () => result.sum)
    .exhaustive();
}

function safeJson(value: unknown): unknown {
  const serialized = attempt(() => JSON.parse(serializeJson(value)) as unknown);
  if (isErr(serialized)) {
    return null;
  }
  return serialized.value;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function taskArgs<DATA extends Data>(
  item: DataItem<
    InferDataInput<DATA>,
    InferDataOutput<DATA>,
    InferDataExtra<DATA>
  >
): TaskArgs<InferDataInput<DATA>, InferDataExtra<DATA>>;
function taskArgs(
  item: DataItem & { output?: unknown }
): TaskArgs<unknown, Record<string, unknown>> {
  const { expected: _expected, output: _output, ...args } = item;
  return args;
}
