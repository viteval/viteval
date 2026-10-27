import { describe, expectTypeOf, it } from 'vitest';
import { defineConfig } from './index';
import type { ModelId, VitevalConfig } from './types';
import type { RuntimeContext } from './runtime';
import { defineDataset } from '#/dataset';
import { evaluate } from '#/evaluate';
import { createScorer, scorers } from '#/scorer';

describe('V1 configuration types', () => {
  it('should expose Viteval configuration instead of runner options', () => {
    expectTypeOf(
      defineConfig({
        eval: { concurrency: 2, results: [], retries: 1, timeout: 1000 },
      })
    ).toEqualTypeOf<VitevalConfig>();
    // @ts-expect-error Runner configuration is not the public V1 API.
    defineConfig({ test: {} });
    // @ts-expect-error Result destinations are arrays, never booleans.
    defineConfig({ eval: { results: false } });
    // @ts-expect-error Model strings require a provider prefix.
    expectTypeOf('gpt-4.1-mini').toMatchTypeOf<ModelId>();
    // @ts-expect-error Unknown storage integrations do not appear in the registry.
    defineConfig({ dataset: { providers: ['missing'] } });
  });

  it('should infer generated cases and callback-based dataset reads', () => {
    const dataset = defineDataset({
      data: ({ models }) => {
        expectTypeOf(models).toEqualTypeOf<RuntimeContext['models']>();
        return [{ input: 'question', expected: 1, reviewed: true }];
      },
      name: 'support',
      providers: [],
    });
    evaluate('generated', {
      data: dataset,
      scorers: [scorers.exactMatch()],
      task: ({ input, reviewed }) => {
        expectTypeOf(input).toEqualTypeOf<string>();
        expectTypeOf(reviewed).toEqualTypeOf<boolean>();
        return 1;
      },
    });
    evaluate('saved', {
      data: ({ json }) =>
        json.dataset<{ input: string; expected: number; reviewed: boolean }>(
          'support'
        ),
      task: ({ input, reviewed }) => {
        expectTypeOf(input).toEqualTypeOf<string>();
        expectTypeOf(reviewed).toEqualTypeOf<boolean>();
        return 1;
      },
      scorers: [
        createScorer<number>({
          name: 'positive',
          score: ({ output, expected }) => {
            expectTypeOf(expected).toEqualTypeOf<number>();
            return { score: output === expected ? 1 : 0 };
          },
        }),
      ],
    });
    evaluate('invalid options', {
      data: [{ input: 'a', expected: 'a' }],
      task: ({ input }) => input,
      scorers: [scorers.exactMatch()],
      // @ts-expect-error Native options are not evaluation options.
      testOptions: { timeout: 1000 },
    });
  });
});
