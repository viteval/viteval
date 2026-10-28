import { MockEmbeddingModelV4, MockLanguageModelV4 } from 'ai/test';
import { afterEach, describe, expect, it } from 'vitest';
import {
  closeProjectRuntime,
  createProjectRuntime,
  runWithProjectRuntime,
} from '#/config/runtime';
import {
  getEmbeddingModel,
  getModel,
  requireEmbeddingModel,
  requireModel,
  resolveEmbeddingModel,
  resolveLanguageModel,
} from './client';

afterEach(async () => {
  await closeProjectRuntime();
});

describe('model selection', () => {
  it('should resolve direct model instances without a project', () => {
    const language = new MockLanguageModelV4(),
      embedding = new MockEmbeddingModelV4();
    expect(resolveLanguageModel(language)).toMatchObject({
      ok: true,
      value: language,
    });
    expect(resolveEmbeddingModel(embedding)).toMatchObject({
      ok: true,
      value: embedding,
    });
  });

  it('should return actionable errors for IDs outside a project', () => {
    expect(resolveLanguageModel('missing:model')).toMatchObject({
      ok: false,
      error: { message: expect.stringContaining('models.providers') },
    });
    expect(resolveEmbeddingModel('missing:model')).toMatchObject({
      ok: false,
      error: { message: expect.stringContaining('models.providers') },
    });
  });

  it('should report missing defaults instead of throwing', () => {
    expect(resolveLanguageModel()).toMatchObject({ ok: false });
    expect(resolveEmbeddingModel()).toMatchObject({ ok: false });
  });

  it('should resolve configured defaults and explicit namespaced selections', () => {
    const language = new MockLanguageModelV4({ provider: 'local.chat' }),
      embedding = new MockEmbeddingModelV4({ provider: 'local.embedding' });
    runWithProjectRuntime({
      runtime: createProjectRuntime({
        models: {
          providers: [
            {
              specificationVersion: 'v4',
              languageModel: () => language,
              embeddingModel: () => embedding,
            },
          ],
          defaults: { language: 'local:chat', embedding: 'local:embed' },
        },
      }),
      run: () => {
        expect(getModel()).toBe(language);
        expect(getEmbeddingModel()).toBe(embedding);
        expect(resolveLanguageModel()).toMatchObject({
          ok: true,
          value: language,
        });
        expect(resolveEmbeddingModel()).toMatchObject({
          ok: true,
          value: embedding,
        });
        expect(resolveLanguageModel('local:other')).toMatchObject({
          ok: true,
          value: language,
        });
        expect(resolveEmbeddingModel('local:other')).toMatchObject({
          ok: true,
          value: embedding,
        });
        expect(resolveLanguageModel('missing:other')).toMatchObject({
          ok: false,
        });
        expect(resolveEmbeddingModel('missing:other')).toMatchObject({
          ok: false,
        });
      },
    });
  });

  it('should preserve registry failures in the Result contract', () => {
    let unavailable = false;
    const runtime = createProjectRuntime({
      get models() {
        return unavailable
          ? {
              providers: [],
              defaults: {
                language: 'missing:model' as const,
                embedding: 'missing:model' as const,
              },
            }
          : undefined;
      },
    });
    runWithProjectRuntime({
      runtime,
      run: () => {
        unavailable = true;
        expect(requireModel()).toMatchObject({ ok: false });
        expect(requireEmbeddingModel()).toMatchObject({ ok: false });
      },
    });
  });

  it('should report missing models when a project has no model configuration', () => {
    runWithProjectRuntime({
      runtime: createProjectRuntime({}),
      run: () => {
        expect(getModel()).toBeNull();
        expect(getEmbeddingModel()).toBeNull();
        expect(requireModel()).toMatchObject({
          ok: false,
          error: {
            message: expect.stringContaining('models.defaults.language'),
          },
        });
        expect(requireEmbeddingModel()).toMatchObject({
          ok: false,
          error: {
            message: expect.stringContaining('models.defaults.embedding'),
          },
        });
      },
    });
  });
});
