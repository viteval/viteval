import { err, ok } from 'massaman/control';
import { MockEmbeddingModelV4, MockLanguageModelV4 } from 'ai/test';
import type { ModelProvider, VitevalConfig } from './types';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createProvider } from '#/provider/create';
import { createJsonProvider } from '#/provider/json';
import {
  closeProjectRuntime,
  createProjectRuntime,
  getProjectRuntime,
  getRuntimeContext,
  runWithProjectRuntime,
  withProjectRuntime,
} from './runtime';

afterEach(async () => {
  await closeProjectRuntime();
});

describe('createProjectRuntime', () => {
  it('should make concurrent close callers wait for the same cleanup', async () => {
    const ready = Promise.withResolvers<void>();
    const close = vi.fn(async () => {
      await ready.promise;
      return ok(undefined);
    });
    const runtime = createProjectRuntime({
      providers: [createProvider({ name: 'json', close })],
    });
    await runtime.provider('json');
    const first = runtime.close();
    const second = runtime.close();
    expect(second).toBe(first);
    await expect(runtime.provider('json')).rejects.toThrow('closed');
    ready.resolve();
    await Promise.all([first, second]);
    expect(close).toHaveBeenCalledOnce();
  });

  it('should retain execution failures when cleanup also fails', async () => {
    const executionError = new Error('execution rejected');
    await expect(
      withProjectRuntime({
        config: {
          providers: [
            createProvider({
              name: 'json',
              close: async () => err('cleanup rejected'),
            }),
          ],
        },
        run: async () => {
          await getProjectRuntime()!.provider('json');
          throw executionError;
        },
      })
    ).rejects.toMatchObject({
      errors: [executionError, expect.any(AggregateError)],
    });
    expect(getProjectRuntime()).toBeUndefined();
  });

  it('should return scoped operation values after cleanup', async () => {
    await expect(
      withProjectRuntime({ config: {}, run: () => 42 })
    ).resolves.toBe(42);
  });

  it('should propagate operation failures after successful cleanup', async () => {
    const failure = new Error('operation rejected');
    await expect(
      withProjectRuntime({
        config: {},
        run: () => {
          throw failure;
        },
      })
    ).rejects.toBe(failure);
  });

  it('should propagate cleanup failures after a successful operation', async () => {
    await expect(
      withProjectRuntime({
        config: {
          providers: [
            createProvider({
              name: 'json',
              close: async () => err('cleanup rejected'),
            }),
          ],
        },
        run: async () => {
          await getProjectRuntime()!.provider('json');
          return 42;
        },
      })
    ).rejects.toThrow(AggregateError);
  });

  it('should initialize used providers once and leave unused providers unopened', async () => {
    const initialize = vi.fn(async () => ok(undefined)),
      close = vi.fn(async () => ok(undefined)),
      unused = vi.fn(async () => ok(undefined)),
      provider = createProvider({ close, initialize, name: 'json' }),
      runtime = createProjectRuntime({
        providers: [
          provider,
          createProvider({ initialize: unused, name: 'unused' }),
        ],
      });
    expect(initialize).not.toHaveBeenCalled();
    expect(
      await Promise.all([runtime.provider('json'), runtime.provider('json')])
    ).toEqual([provider, provider]);
    expect(initialize).toHaveBeenCalledTimes(1);
    await runtime.close();
    await runtime.close();
    expect(close).toHaveBeenCalledTimes(1);
    expect(unused).not.toHaveBeenCalled();
    await expect(runtime.provider('json')).rejects.toThrow('closed');
  });

  it('should wait for initialization before closing a provider', async () => {
    const events: string[] = [],
      runtime = createProjectRuntime({
        providers: [
          createProvider({
            close: async () => {
              events.push('close');
              return ok(undefined);
            },
            initialize: async () => {
              await Promise.resolve();
              events.push('initialize');
              return ok(undefined);
            },
            name: 'json',
          }),
        ],
      });
    await Promise.all([runtime.provider('json'), runtime.close()]);
    expect(events).toEqual(['initialize', 'close']);
  });

  it('should attempt every close even when a provider fails', async () => {
    const close = vi.fn(async () => ok(undefined)),
      runtime = createProjectRuntime({
        providers: [
          createProvider({
            close: async () => err('flush rejected'),
            name: 'json',
          }),
          createProvider({ close, name: 'other' }),
        ],
      });
    await Promise.all([runtime.provider('json'), runtime.provider('other')]);
    await expect(runtime.close()).rejects.toThrow(AggregateError);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('should cache initialization errors rather than repeatedly opening clients', async () => {
    const initialize = vi.fn(async () => err('bad credentials')),
      runtime = createProjectRuntime({
        providers: [createProvider({ initialize, name: 'json' })],
      });
    await expect(runtime.provider('json')).rejects.toThrow('bad credentials');
    await expect(runtime.provider('json')).rejects.toThrow('bad credentials');
    expect(initialize).toHaveBeenCalledTimes(1);
    await runtime.close();
  });

  it.each(['returned', 'thrown'] as const)(
    'should close partially initialized resources after a %s initialization failure',
    async (failure) => {
      const close = vi.fn(async () => ok(undefined)),
        runtime = createProjectRuntime({
          providers: [
            createProvider({
              name: 'json',
              close,
              initialize: async () => {
                if (failure === 'thrown') throw new Error('partial allocation');
                return err('partial allocation');
              },
            }),
          ],
        });
      const initialization = expect(runtime.provider('json')).rejects.toThrow(
        'partial allocation'
      );
      await runtime.close();
      await initialization;
      expect(close).toHaveBeenCalledExactlyOnceWith();
    }
  );

  it('should aggregate cleanup failures independently of initialization failures', async () => {
    const runtime = createProjectRuntime({
      providers: [
        createProvider({
          name: 'json',
          initialize: async () => err('initialization failure'),
          close: async () => err('cleanup failure'),
        }),
      ],
    });
    await expect(runtime.provider('json')).rejects.toThrow(
      'initialization failure'
    );
    await expect(runtime.close()).rejects.toMatchObject({
      errors: [
        expect.objectContaining({
          message: 'Failed to close provider "json": cleanup failure',
        }),
      ],
    });
  });

  it('should inherit destinations, replace explicit selections, and disable empty selections', () => {
    const runtime = createProjectRuntime({
      dataset: { providers: ['json'] },
      eval: { results: ['json'] },
    });
    expect(runtime.resultNames()).toEqual(['json']);
    expect(runtime.datasetNames()).toEqual(['json']);
    expect(runtime.resultNames([])).toEqual([]);
    expect(runtime.datasetNames([])).toEqual([]);
    expect(runtime.resultNames(['json', 'json'])).toEqual(['json']);
    expect(createProjectRuntime({ providers: [] }).resultNames()).toEqual([]);
    expect(createProjectRuntime({ providers: [] }).datasetNames()).toEqual([]);
    expect(createProjectRuntime({}).datasetNames()).toEqual(['json']);
    expect(createProjectRuntime({}).resultNames()).toEqual(['json']);
  });

  it('should reject duplicate and reserved storage identities', () => {
    expect(() =>
      createProjectRuntime({
        providers: [createJsonProvider(), createJsonProvider()],
      })
    ).toThrow('Duplicate storage provider');
    expect(() =>
      createProjectRuntime({ providers: [createProvider({ name: 'models' })] })
    ).toThrow('reserved');
  });

  it('should report missing registrations without opening other providers', async () => {
    const runtime = createProjectRuntime({ providers: [] });
    await expect(runtime.provider('json')).rejects.toThrow('not registered');
    expect(() => runtime.context.json).toThrow('not registered');
    expect(() => runtime.resultNames(['json'])).toThrow('not registered');
  });

  it.each([
    { timeout: 0 },
    { timeout: -1 },
    { concurrency: 1.5 },
    { retries: -1 },
    { threshold: Number.NaN },
  ])('should reject invalid evaluation defaults %j', (evalOptions) => {
    expect(() => createProjectRuntime({ eval: evalOptions })).toThrow();
  });

  it('should accept valid evaluation limits', () => {
    expect(() =>
      createProjectRuntime({
        eval: { concurrency: 1, retries: 0, timeout: 1, threshold: 0 },
      })
    ).not.toThrow();
  });

  it('should reject non-array destinations from untyped configurations', () => {
    const runtime = createProjectRuntime({
      eval: { results: false },
    } as unknown as VitevalConfig);
    expect(() => runtime.resultNames()).toThrow('must be an array');
  });

  it('should preserve symbol property reads on the runtime proxy', () => {
    expect(
      Reflect.get(createProjectRuntime({}).context, Symbol.iterator)
    ).toBeUndefined();
  });

  it('should report unsupported datasets without attempting reads', async () => {
    const runtime = createProjectRuntime({
      providers: [createProvider({ name: 'json' })],
    });
    await expect(
      runtime.context.json.dataset('missing').load()
    ).rejects.toThrow('does not support datasets');
    await runtime.close();
  });

  it.each(['missing', 'get-error', 'items-error', 'success'] as const)(
    'should resolve provider datasets: %s',
    async (behavior) => {
      const json = createJsonProvider(),
        dataset = {
          id: 'dataset',
          name: 'support',
          description: '',
          version: 1,
          itemCount: 1,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        runtime = createProjectRuntime({
          providers: [
            createProvider({
              name: 'json',
              datasets: {
                ...json.datasets!,
                get: async () =>
                  behavior === 'get-error'
                    ? err('lookup failed')
                    : ok(behavior === 'missing' ? null : dataset),
                getItems: async () =>
                  behavior === 'items-error'
                    ? err('read failed')
                    : ok([
                        {
                          id: 'item',
                          datasetId: 'dataset',
                          input: 'question',
                          expected: 1,
                          extra: { reviewed: true },
                          ordinal: 0,
                        },
                      ]),
              },
            }),
          ],
        });
      const reference = runtime.context.json.dataset('support');
      expect(reference.name).toBe('support');
      if (behavior === 'success') {
        await expect(reference.load()).resolves.toEqual([
          { input: 'question', expected: 1, reviewed: true },
        ]);
      } else {
        const message = {
          missing: 'not found',
          'get-error': 'lookup failed',
          'items-error': 'read failed',
        }[behavior];
        await expect(reference.load()).rejects.toThrow(message);
      }
      await runtime.close();
    }
  );
});

describe('worker runtime lifecycle', () => {
  it('should scope nested runtimes without replacing the caller context', async () => {
    expect(getProjectRuntime()).toBeUndefined();
    expect(getRuntimeContext().json.dataset('default').name).toBe('default');
    const runtime = createProjectRuntime({});
    await runWithProjectRuntime({
      runtime,
      run: async () => {
        expect(getRuntimeContext()).toBe(runtime.context);
        const nested = createProjectRuntime({});
        runWithProjectRuntime({
          runtime: nested,
          run: () => {
            expect(getProjectRuntime()).toBe(nested);
          },
        });
        expect(getProjectRuntime()).toBe(runtime);
        await closeProjectRuntime();
      },
    });
    expect(getProjectRuntime()).toBeUndefined();
    await closeProjectRuntime();
  });

  it('should release the active runtime even when cleanup fails', async () => {
    const runtime = createProjectRuntime({
      providers: [
        createProvider({
          name: 'json',
          close: async () => {
            throw new Error('close failed');
          },
        }),
      ],
    });
    await expect(
      runWithProjectRuntime({
        runtime,
        run: async () => {
          await runtime.provider('json');
          await closeProjectRuntime();
        },
      })
    ).rejects.toThrow(AggregateError);
    expect(getProjectRuntime()).toBeUndefined();
  });
});

describe('model registry', () => {
  it('should preserve dotted provider names while removing only the SDK API suffix', () => {
    const language = new MockLanguageModelV4({
        provider: 'company.gateway.responses',
      }),
      embedding = new MockEmbeddingModelV4({
        provider: 'company.gateway.embedding',
      }),
      runtime = createProjectRuntime({
        models: {
          providers: [modelProvider({ language, embedding })],
          defaults: {
            language: 'company.gateway:chat',
            embedding: 'company.gateway:embed',
          },
        },
      });
    expect(runtime.context.models.languageModel('company.gateway:chat')).toBe(
      language
    );
    expect(runtime.context.models.embeddingModel('company.gateway:embed')).toBe(
      embedding
    );
  });

  it('should reject model lookups when no model providers are configured', () => {
    const runtime = createProjectRuntime({});
    expect(() =>
      runtime.context.models.languageModel('missing:model')
    ).toThrow();
    expect(() =>
      runtime.context.models.embeddingModel('missing:model')
    ).toThrow();
  });

  it('should accept bare provider identities', () => {
    const language = new MockLanguageModelV4({ provider: 'bare' });
    expect(
      createProjectRuntime({
        models: { providers: [modelProvider({ language })] },
      }).context.models.languageModel('bare:model')
    ).toBe(language);
  });

  it('should fall back to embedding-only provider identities', () => {
    const embedding = new MockEmbeddingModelV4({
        provider: 'vector.embedding',
      }),
      provider = modelProvider({ embedding });
    expect(
      createProjectRuntime({
        models: { providers: [provider] },
      }).context.models.embeddingModel('vector:embed')
    ).toBe(embedding);
  });

  it('should reject duplicate model identities', () => {
    const provider = modelProvider({
      language: new MockLanguageModelV4({ provider: 'duplicate.chat' }),
    });
    expect(() =>
      createProjectRuntime({ models: { providers: [provider, provider] } })
    ).toThrow('Duplicate model provider');
  });

  it('should explain providers that reject the identity probe', () => {
    expect(() =>
      createProjectRuntime({ models: { providers: [modelProvider({})] } })
    ).toThrow('Cannot determine AI SDK provider identity');
    expect(() =>
      createProjectRuntime({
        models: {
          providers: [{ ...modelProvider({}), embeddingModel: undefined }],
        },
      })
    ).toThrow(AggregateError);
  });

  it('should reject empty provider identities', () => {
    expect(() =>
      createProjectRuntime({
        models: {
          providers: [
            modelProvider({
              language: new MockLanguageModelV4({ provider: '' }),
              embedding: new MockEmbeddingModelV4({ provider: '' }),
            }),
          ],
        },
      })
    ).toThrow(AggregateError);
  });

  it.each([':model', 'provider:', 'bare'])(
    'should reject malformed model IDs %s',
    (id) => {
      expect(() =>
        createProjectRuntime({}).context.models.languageModel(
          id as `${string}:${string}`
        )
      ).toThrow('Invalid model ID');
    }
  );
});

function modelProvider(options: {
  language?: MockLanguageModelV4;
  embedding?: MockEmbeddingModelV4;
}): ModelProvider {
  return {
    specificationVersion: 'v4',
    languageModel() {
      if (!options.language) throw new Error('No language model');
      return options.language;
    },
    embeddingModel() {
      if (!options.embedding) throw new Error('No embedding model');
      return options.embedding;
    },
  };
}
