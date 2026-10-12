import { MockLanguageModelV4 } from 'ai/test';
import { describe, expect, it } from 'vitest';
import { runJudge } from './judge';

describe('runJudge', () => {
  it('should return malformed prompt failures as an error Result', async () => {
    const result = await runJudge(
      {
        model: new MockLanguageModelV4(),
        prompt: '{{#item}}',
        choiceScores: { Yes: 1 },
      },
      {}
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected a prompt rendering failure');
    expect(result.error.message).toContain('Unclosed section');
  });
});
