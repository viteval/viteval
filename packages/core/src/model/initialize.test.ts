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
    const language = requireModel();
    const embedding = requireEmbeddingModel();
    expect(language.ok).toBe(false);
    expect(embedding.ok).toBe(false);
    if (!language.ok)
      expect(language.error.message).toContain('Vitest setup file');
    if (!embedding.ok)
      expect(embedding.error.message).toContain(
        'Embedding model not configured'
      );
    expect(
      await runJudge(
        { prompt: '{{output}}', choiceScores: { Yes: 1, No: 0 } },
        { output: 'answer' }
      )
    ).toMatchObject({ ok: false });
    expect(
      await computeEmbeddingSimilarity('answer', 'different')
    ).toMatchObject({
      score: null,
      metadata: {
        similarity: 0,
        error: expect.stringContaining('Embedding model not configured'),
      },
    });
  });

  it('should retain the first language model and backfill embedding configuration', () => {
    const language = createLanguageModel();
    const other = createLanguageModel();
    const embedding = new MockEmbeddingModelV4();
    initializeModel(language);
    initializeModel({ language: other, embedding });
    expect(requireModel()).toMatchObject({ ok: true, value: language });
    expect(requireEmbeddingModel()).toMatchObject({
      ok: true,
      value: embedding,
    });
    initializeModel({ language: other, embedding: new MockEmbeddingModelV4() });
    expect(getEmbeddingModel()).toBe(embedding);
  });

  it('should execute a structured judge through the configured AI SDK model', async () => {
    const language = createLanguageModel();
    initializeModel({ language });
    expect(
      await runJudge(
        {
          prompt: 'Does {{output}} answer {{input}}?',
          choiceScores: { Yes: 1, No: 0 },
          useCoT: true,
        },
        { input: 'question', output: 'answer' }
      )
    ).toMatchObject({
      ok: true,
      value: { score: 1, choice: 'Yes', rationale: 'The answer matches.' },
    });
    expect(language.doGenerateCalls[0].prompt).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: 'user',
          content: expect.arrayContaining([
            expect.objectContaining({
              type: 'text',
              text: expect.stringContaining('Does answer answer question?'),
            }),
          ]),
        }),
      ])
    );
  });

  it('should allow a judge-specific model override without global initialization', async () => {
    expect(
      await runJudge(
        {
          model: createLanguageModel(),
          prompt: '{{output}}',
          choiceScores: { Yes: 1, No: 0 },
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
      { prompt: '{{output}}', choiceScores: { Yes: 1, No: 0 } },
      { output: 'answer' }
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('model unavailable');
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
    initializeModel({ language: createLanguageModel(), embedding });
    expect(await computeEmbeddingSimilarity('north', 'east')).toMatchObject({
      score: 0,
      metadata: { similarity: 0 },
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
          type: 'text',
          text: JSON.stringify({
            choice: 'Yes',
            reasons: 'The answer matches.',
          }),
        },
      ],
      finishReason: { unified: 'stop', raw: undefined },
      usage: {
        inputTokens: {
          total: 10,
          noCache: 10,
          cacheRead: undefined,
          cacheWrite: undefined,
        },
        outputTokens: { total: 10, text: 10, reasoning: undefined },
      },
      warnings: [],
    }),
  });
}
