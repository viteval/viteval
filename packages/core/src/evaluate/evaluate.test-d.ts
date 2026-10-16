import { describe, expectTypeOf, it } from 'vitest';
import { evaluate } from './evaluate';
import { createScorer } from '#/scorer/custom';
import { defineDataset } from '#/dataset/dataset';

describe('evaluate inference', () => {
  it('should infer input, extras, and independent task outputs', () => {
    evaluate('typed output', {
      data: [{ input: 'question', expected: 'answer', context: ['reference'] }],
      task: ({ input, context }) => {
        expectTypeOf(input).toEqualTypeOf<string>();
        expectTypeOf(context).toEqualTypeOf<string[]>();
        return { text: input };
      },
      scorers: [
        createScorer<{ text: string }, string, { context: string[] }>({
          name: 'typed',
          score: ({ output, expected, context }) => {
            expectTypeOf(output.text).toEqualTypeOf<string>();
            expectTypeOf(expected).toEqualTypeOf<string>();
            expectTypeOf(context).toEqualTypeOf<string[]>();
            return { score: 1 };
          },
        }),
      ],
    });
  });
  it('should infer generated dataset items', () => {
    const data = defineDataset({
      name: 'typed',
      storage: 'memory',
      data: async () => [
        { input: { question: 'hello' }, expected: 1, category: 'greeting' },
      ],
    });
    evaluate('typed dataset', {
      data,
      task: ({ input, category }) => {
        expectTypeOf(input.question).toEqualTypeOf<string>();
        expectTypeOf(category).toEqualTypeOf<string>();
        return 1;
      },
      scorers: [
        createScorer<number, number>({
          name: 'number',
          score: ({ output, expected }) => ({
            score: output === expected ? 1 : 0,
          }),
        }),
      ],
    });
  });
});
