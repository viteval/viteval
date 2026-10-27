import { MockEmbeddingModelV4, MockLanguageModelV4 } from 'ai/test';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { computeEmbeddingSimilarity } from '#/scorer/embedding/embed';
import { runJudge } from '#/scorer/llm/judge';
import {
  getEmbeddingModel,
  getModel,
  requireEmbeddingModel,
  requireModel,
} from '#/model/client';
import { initializeModel } from '#/model/initialize';

beforeEach(() => {
  globalThis.__viteval_model = undefined;
  globalThis.__viteval_embeddingModel = undefined;
});
afterEach(() => {
  globalThis.__viteval_model = undefined;
  globalThis.__viteval_embeddingModel = undefined;
});

describe('initializeModel', () => {
  it('should return actionable errors before models are configured', async () => {
    expect(getModel()).toBeNull();
    expect(getEmbeddingModel()).toBeNull();
    const language = requireModel(),
      embedding = requireEmbeddingModel();
    expect(language.ok).toBe(false);
    expect(embedding.ok).toBe(false);
    if (!language.ok) {
      expect(language.error.message).toContain('models.defaults.language');
    }
    if (!embedding.ok) {
      expect(embedding.error.message).toContain(
        'Embedding model not configured'
      );
    }
    expect(
      await runJudge(
        { choiceScores: { No: 0, Yes: 1 }, prompt: '{{output}}' },
        { output: 'answer' }
      )
    ).toMatchObject({ ok: false });
    expect(
      await computeEmbeddingSimilarity('answer', 'different')
    ).toMatchObject({
      metadata: {
        error: expect.stringContaining('Embedding model not configured'),
        similarity: 0,
      },
      score: null,
    });
  });

  it('should retain the first language model and backfill embedding configuration', () => {
    const language = createLanguageModel(),
      other = createLanguageModel(),
      embedding = new MockEmbeddingModelV4();
    initializeModel(language);
    initializeModel({ embedding, language: other });
    expect(requireModel()).toMatchObject({ ok: true, value: language });
    expect(requireEmbeddingModel()).toMatchObject({
      ok: true,
      value: embedding,
    });
    initializeModel({ embedding: new MockEmbeddingModelV4(), language: other });
    expect(getEmbeddingModel()).toBe(embedding);
  });

  it('should execute a structured judge through the configured AI SDK model', async () => {
    const language = createLanguageModel();
    initializeModel({ language });
    expect(
      await runJudge(
        {
          choiceScores: { No: 0, Yes: 1 },
          prompt: 'Does {{output}} answer {{input}}?',
          useCoT: true,
        },
        { input: 'question', output: 'answer' }
      )
    ).toMatchObject({
      ok: true,
      value: { choice: 'Yes', rationale: 'The answer matches.', score: 1 },
    });
    expect(language.doGenerateCalls[0].prompt).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          content: expect.arrayContaining([
            expect.objectContaining({
              type: 'text',
              text: expect.stringContaining('Does answer answer question?'),
            }),
          ]),
          role: 'user',
        }),
      ])
    );
  });

  it('should allow a judge-specific model override without global initialization', async () => {
    expect(
      await runJudge(
        {
          choiceScores: { No: 0, Yes: 1 },
          model: createLanguageModel(),
          prompt: '{{output}}',
        },
        { output: 'answer' }
      )
    ).toMatchObject({ ok: true, value: { score: 1 } });
    expect(getModel()).toBeNull();
  });

  it('should report model failures through the Result contract', async () => {
    initializeModel(
      new MockLanguageModelV4({
        doGenerate: async () => {
          throw new Error('model unavailable');
        },
      })
    );
    const result = await runJudge(
      { choiceScores: { No: 0, Yes: 1 }, prompt: '{{output}}' },
      { output: 'answer' }
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('model unavailable');
    }
  });

  it('should compute similarity using the configured embedding model', async () => {
    const embedding = new MockEmbeddingModelV4({
      doEmbed: async ({ values }) => ({
        embeddings: values.map((value) =>
          value === 'north' ? [1, 0] : [0, 1]
        ),
        warnings: [],
      }),
    });
    initializeModel({ embedding, language: createLanguageModel() });
    expect(await computeEmbeddingSimilarity('north', 'east')).toMatchObject({
      metadata: { similarity: 0 },
      score: 0,
    });
    expect(embedding.doEmbedCalls.flatMap((call) => call.values)).toEqual([
      'north',
      'east',
    ]);
  });
});

function createLanguageModel() {
  return new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [
        {
          text: JSON.stringify({
            choice: 'Yes',
            reasons: 'The answer matches.',
          }),
          type: 'text',
        },
      ],
      finishReason: { raw: undefined, unified: 'stop' },
      usage: {
        inputTokens: {
          cacheRead: undefined,
          cacheWrite: undefined,
          noCache: 10,
          total: 10,
        },
        outputTokens: { reasoning: undefined, text: 10, total: 10 },
      },
      warnings: [],
    }),
  });
}
