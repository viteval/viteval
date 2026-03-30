import type { Extra, Scorer } from '#/types';

/**
 * Options for wrapping a scorer with input transformations.
 */
export interface WrapScorerOptions<
  OUTPUT,
  EXPECTED,
  INNER_OUTPUT,
  INNER_EXPECTED,
> {
  /**
   * Transform the task output before passing it to the inner scorer.
   *
   * @param output - The task output.
   * @returns The transformed output for the inner scorer.
   */
  output?: (output: OUTPUT) => INNER_OUTPUT;
  /**
   * Transform the expected value before passing it to the inner scorer.
   *
   * @param expected - The expected value from the data item.
   * @returns The transformed expected value for the inner scorer.
   */
  expected?: (expected: EXPECTED) => INNER_EXPECTED;
}

/**
 * Wrap an existing scorer with input transformations.
 *
 * Intercepts the scorer's inputs (`output` and/or `expected`) and transforms
 * them before they reach the inner scorer. Useful for reusing prebuilt scorers
 * when the task output or expected type differs from what the scorer expects.
 *
 * @param scorer - The inner scorer to wrap.
 * @param options - Transformation functions for `output` and/or `expected`.
 * @returns A new scorer with the transformed input types.
 *
 * @example
 * ```ts
 * import { scorers, wrapScorer } from 'viteval';
 *
 * // Reuse exactMatch when expected is an object
 * wrapScorer(scorers.exactMatch(), {
 *   expected: (e: { good: string }) => e.good,
 * });
 *
 * // Transform the task output before scoring
 * wrapScorer(scorers.levenshtein(), {
 *   output: (o: { text: string }) => o.text,
 * });
 *
 * // Transform both
 * wrapScorer(scorers.exactMatch(), {
 *   output: (o: { text: string }) => o.text,
 *   expected: (e: { answer: string }) => e.answer,
 * });
 * ```
 */
export function wrapScorer<
  OUTPUT,
  EXPECTED,
  INNER_OUTPUT = OUTPUT,
  INNER_EXPECTED = EXPECTED,
  EXTRA extends Extra = Extra,
>(
  scorer: Scorer<INNER_OUTPUT, INNER_EXPECTED, EXTRA>,
  options: WrapScorerOptions<OUTPUT, EXPECTED, INNER_OUTPUT, INNER_EXPECTED>
): Scorer<OUTPUT, EXPECTED, EXTRA> {
  const wrapped: Scorer<OUTPUT, EXPECTED, EXTRA> = (args) => {
    const mappedArgs = {
      ...args,
      expected: options.expected
        ? options.expected(args.expected)
        : args.expected,
      output: options.output ? options.output(args.output) : args.output,
    } as Parameters<typeof scorer>[0];

    return scorer(mappedArgs);
  };

  Object.defineProperty(wrapped, 'name', {
    value: scorer.name,
    writable: false,
  });

  return wrapped;
}
