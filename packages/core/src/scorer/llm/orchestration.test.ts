import { MockLanguageModelV4 } from 'ai/test';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { generateObject } = vi.hoisted(() => ({ generateObject: vi.fn() }));
vi.mock('ai', async (importOriginal) => ({
  ...(await importOriginal<typeof import('ai')>()),
  generateObject,
}));

import { createJudgeScorer } from './create-judge-scorer';
import { runJudge } from './judge';
import { translation } from './translation';

describe('judge orchestration', () => {
  const model = new MockLanguageModelV4();
  beforeEach(() => {
    generateObject.mockReset();
  });

  it('should reject unknown judge choices', async () => {
    generateObject.mockResolvedValue({ object: { choice: 'Unknown' } });
    const result = await runJudge(
      { model, prompt: '{{output}}', choiceScores: { Yes: 1 } },
      { output: 'answer' }
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected unknown choice failure');
    expect(result.error.message).toContain('Unknown choice "Unknown"');
  });

  it('should return results without requiring chain-of-thought reasons', async () => {
    generateObject.mockResolvedValue({ object: { choice: 'Yes' } });
    expect(
      await runJudge(
        {
          model,
          prompt: '{{output}}',
          choiceScores: { Yes: 1 },
          useCoT: false,
        },
        { output: 'answer' }
      )
    ).toMatchObject({
      ok: true,
      value: { choice: 'Yes', score: 1, rationale: undefined },
    });
    expect(generateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        model,
        prompt: 'answer\n\nSelect one of the following choices: "Yes".',
        temperature: 0,
      })
    );
  });

  it('should return model override errors without invoking generation', async () => {
    const result = await runJudge(
      { model: 'missing:model', prompt: 'prompt', choiceScores: { Yes: 1 } },
      {}
    );
    expect(result.ok).toBe(false);
    expect(generateObject).not.toHaveBeenCalled();
  });

  it('should use custom factory configuration and extra template variables', async () => {
    generateObject.mockResolvedValue({
      object: { choice: 'Yes', reasons: 'sound' },
    });
    const factory = createJudgeScorer({
      name: 'CustomJudge',
      prompt: '{{topic}}: {{input}} / {{output}} / {{expected}}',
      choiceScores: { Yes: 0.75 },
      useCoT: false,
    });
    const result = await factory({ model })({
      input: 'question',
      output: 'answer',
      expected: 'reference',
      topic: 'science',
    });
    expect(result).toMatchObject({
      name: 'CustomJudge',
      score: 0.75,
      metadata: { choice: 'Yes', rationale: 'sound' },
    });
    expect(generateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        model,
        prompt: expect.stringContaining(
          'science: question / answer / reference'
        ),
      })
    );
  });

  it('should return factory model errors as null scores', async () => {
    const factory = createJudgeScorer({
      name: 'CustomJudge',
      prompt: '{{output}}',
      choiceScores: { Yes: 1 },
    });
    expect(
      await factory({ model: 'missing:model' })({ output: 'answer' })
    ).toMatchObject({
      name: 'CustomJudge',
      score: null,
      metadata: { error: expect.stringContaining('Model IDs require') },
    });
    expect(generateObject).not.toHaveBeenCalled();
  });

  it('should return translation generation errors as null scores', async () => {
    generateObject.mockRejectedValue(new Error('provider unavailable'));
    expect(
      await translation({ model })({
        input: 'bonjour',
        expected: 'hello',
        output: 'hi',
        language: null,
      })
    ).toMatchObject({
      score: null,
      metadata: { error: 'provider unavailable' },
    });
  });
});
