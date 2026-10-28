import { AsyncLocalStorage } from 'node:async_hooks';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createDatasetBootstrap,
  instrumentDatasetModule,
  normalizeDatasetPath,
} from './bootstrap';

afterEach(() => vi.unstubAllGlobals());

describe('instrumentDatasetModule', () => {
  it.each([
    '',
    'globalThis.moduleRan = true;',
    '#!/usr/bin/env node\nglobalThis.moduleRan = true;',
    '#!/usr/bin/env node',
  ])(
    'should checkpoint successful module imports without breaking shebangs: %j',
    (code) => {
      const startModule = vi.fn(() => 4),
        finishModule = vi.fn(),
        file = '/app/quoted "module".eval.ts';
      vi.stubGlobal('__viteval_datasetDiscovery', {
        startModule,
        finishModule,
      });
      vi.stubGlobal('moduleRan', false);
      const instrumented = instrumentDatasetModule({
        code,
        file,
        checkpoint: '__checkpoint',
      });
      if (code.startsWith('#!'))
        expect(instrumented.split('\n')[0]).toBe('#!/usr/bin/env node');
      new Function(instrumented.replace(/^#![^\n]*\n/, ''))();
      expect(startModule).toHaveBeenCalledOnce();
      expect(finishModule).toHaveBeenCalledExactlyOnceWith(file, 4);
    }
  );

  it('should omit successful checkpoints when a module throws', () => {
    const finishModule = vi.fn();
    vi.stubGlobal('__viteval_datasetDiscovery', {
      startModule: () => 0,
      finishModule,
    });
    const code = instrumentDatasetModule({
      code: "throw new Error('import failed');",
      file: '/broken.eval.ts',
      checkpoint: '__checkpoint',
    });
    expect(() => new Function(code)()).toThrow('import failed');
    expect(finishModule).not.toHaveBeenCalled();
  });

  it('should remain usable when discovery is not installed', () => {
    vi.stubGlobal('__viteval_datasetDiscovery', undefined);
    expect(() =>
      new Function(
        instrumentDatasetModule({
          code: '',
          file: '/app/eval.ts',
          checkpoint: '__checkpoint',
        })
      )()
    ).not.toThrow();
  });
});

describe('normalizeDatasetPath', () => {
  it('should normalize Windows paths and preserve POSIX module IDs', () => {
    expect(normalizeDatasetPath('C:\\app\\questions.eval.ts')).toBe(
      'C:/app/questions.eval.ts'
    );
    expect(normalizeDatasetPath('/app/questions.eval.ts')).toBe(
      '/app/questions.eval.ts'
    );
  });
});

describe('createDatasetBootstrap', () => {
  it('should capture only successful matched imports and restore previous discovery', async () => {
    const previous = { register: vi.fn() },
      hooks: (() => void)[] = [];
    vi.stubGlobal('__viteval_datasetDiscovery', previous);
    const source = createDatasetBootstrap()
        .replace("import { AsyncLocalStorage } from 'node:async_hooks';", '')
        .replace("import { afterAll } from 'vitest';", '')
        .replaceAll('export function', 'function'),
      bootstrap: {
        takeCandidates(): unknown[];
        moduleCandidates(file: string): unknown[];
        restoreDiscovery(): void;
        discovery: {
          register(value: unknown): void;
          startModule(): number;
          finishModule(file: string, checkpoint: number): void;
        };
      } = new Function(
        'afterAll',
        'AsyncLocalStorage',
        `${source}\nreturn { takeCandidates, moduleCandidates, restoreDiscovery, discovery };`
      )((hook: () => void) => hooks.push(hook), AsyncLocalStorage),
      discovery = bootstrap.discovery;
    discovery.register('unmatched');
    const checkpoint = discovery.startModule();
    discovery.register('matched');
    discovery.finishModule('/matched.eval.ts', checkpoint);
    expect(bootstrap.moduleCandidates('/matched.eval.ts')).toEqual(['matched']);
    expect(bootstrap.moduleCandidates('/missing.eval.ts')).toEqual([]);
    expect(bootstrap.takeCandidates()).toEqual(['unmatched', 'matched']);
    expect(bootstrap.takeCandidates()).toEqual([]);
    const parent = discovery.startModule();
    await Promise.resolve().then(() => {
      discovery.startModule();
      discovery.register('failed nested import');
    });
    discovery.register('successful parent');
    discovery.finishModule('/parent.eval.ts', parent);
    expect(bootstrap.moduleCandidates('/parent.eval.ts')).toEqual([
      'successful parent',
    ]);
    expect(bootstrap.takeCandidates()).toEqual(['successful parent']);
    hooks[0]();
    expect(Reflect.get(globalThis, '__viteval_datasetDiscovery')).toBe(
      previous
    );
    vi.stubGlobal('__viteval_datasetDiscovery', { register: vi.fn() });
    const replacement = Reflect.get(globalThis, '__viteval_datasetDiscovery');
    bootstrap.restoreDiscovery();
    expect(Reflect.get(globalThis, '__viteval_datasetDiscovery')).toBe(
      replacement
    );
  });
});
