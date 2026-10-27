import { describe, expect, it } from 'vitest';
import { EVAL_RESULT_ARTIFACT_TYPE, isEvalResultArtifact } from './artifact';

describe('isEvalResultArtifact', () => {
  it('should recognize evaluation payloads and reject unrelated or incomplete artifacts', () => {
    expect(
      isEvalResultArtifact({ type: 'internal:browserTrace', data: {} })
    ).toBe(false);
    // @ts-expect-error Third-party artifacts can arrive without the required result payload.
    expect(isEvalResultArtifact({ type: EVAL_RESULT_ARTIFACT_TYPE })).toBe(
      false
    );
    expect(
      isEvalResultArtifact({
        type: EVAL_RESULT_ARTIFACT_TYPE,
        result: {
          aggregation: 'mean',
          name: 'case',
          input: 'q',
          expected: 'a',
          output: 'a',
          threshold: 1,
          mean: 1,
          median: 1,
          sum: 1,
          scores: [],
        },
      })
    ).toBe(true);
  });
});
