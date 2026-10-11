import type { TestArtifact, TestArtifactBase } from 'vitest';
import type { EvalResult } from '#/types';

export const EVAL_RESULT_ARTIFACT_TYPE = 'viteval:eval-result' as const;

export interface EvalResultArtifact extends TestArtifactBase {
  result: EvalResult;
  type: typeof EVAL_RESULT_ARTIFACT_TYPE;
}

declare module 'vitest' {
  interface TaskMeta {
    viteval?: true;
    vitevalEvaluationId?: string;
  }

  interface TestArtifactRegistry {
    vitevalEvalResult: EvalResultArtifact;
  }
}

/**
 * Check whether a Vitest artifact contains a Viteval evaluation result.
 *
 * @param artifact - The reported Vitest artifact.
 * @returns Whether the artifact is a Viteval evaluation result.
 */
export function isEvalResultArtifact(
  artifact: TestArtifact
): artifact is EvalResultArtifact {
  return artifact.type === EVAL_RESULT_ARTIFACT_TYPE && 'result' in artifact;
}
