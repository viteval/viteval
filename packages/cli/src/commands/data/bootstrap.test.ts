import { AsyncLocalStorage } from 'node:async_hooks';
import { describe, expect, it, vi } from 'vitest';
import {
  createDatasetBootstrap,
  instrumentDatasetModule,
  normalizeDatasetPath,
} from './bootstrap';

describe('instrumentDatasetModule', () => {
  it.each([
    '',
    'const moduleRan = true;',
    '#!/usr/bin/env node\nconst moduleRan = true;',
    '#!/usr/bin/env node',
  ])(
    'should checkpoint successful module imports without breaking shebangs: %j',
    (code) => {
      const startModule = vi.fn(() => 4),
        finishModule = vi.fn(),
        file = '/app/quoted "module".eval.ts';
      const discovery = {
        startModule,
        finishModule,
      };
      const instrumented = instrumentDatasetModule({
        code,
        file,
        checkpoint: '__checkpoint',
      });
      if (code.startsWith('#!')) {
        expect(instrumented.split('\n')[0]).toBe('#!/usr/bin/env node');
      }
      executeModule({ code: instrumented, discovery });
      expect(startModule).toHaveBeenCalledOnce();
      expect(finishModule).toHaveBeenCalledExactlyOnceWith(file, 4);
    }
  );

  it('should omit successful checkpoints when a module throws', () => {
    const finishModule = vi.fn();
    const discovery = {
      startModule: () => 0,
      finishModule,
    };
    const code = instrumentDatasetModule({
      code: "throw new Error('import failed');",
      file: '/broken.eval.ts',
      checkpoint: '__checkpoint',
    });
    expect(() => executeModule({ code, discovery })).toThrow('import failed');
    expect(finishModule).not.toHaveBeenCalled();
  });

  it('should remain usable when discovery is not installed', () => {
    expect(() =>
      executeModule({
        code: instrumentDatasetModule({
          code: '',
          file: '/app/eval.ts',
          checkpoint: '__checkpoint',
        }),
      })
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
  it('should own discovery registrations and capture only successful matched imports', async () => {
    const source = createDatasetBootstrap()
        .replace("import { AsyncLocalStorage } from 'node:async_hooks';", '')
        .replace(/^import \{ getExecutionScope \} from [^\n]+;$/m, '')
        .replaceAll('export function', 'function')
        .replace('export const executionScope', 'const executionScope'),
      bootstrap: {
        takeCandidates(): unknown[];
        moduleCandidates(file: string): unknown[];
        restoreDiscovery(): void;
        discovery: {
          register(value: unknown): void;
          startModule(): symbol;
          finishModule(file: string, checkpoint: symbol): void;
        };
      } = new Function(
        'getExecutionScope',
        'AsyncLocalStorage',
        `${source}\nreturn { takeCandidates, moduleCandidates, restoreDiscovery, discovery };`
      )(() => undefined, AsyncLocalStorage),
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
    bootstrap.restoreDiscovery();
  });
});

function executeModule({
  code,
  discovery,
}: {
  code: string;
  discovery?: {
    startModule(): number;
    finishModule(file: string, checkpoint: number): void;
  };
}): void {
  const source = code
    .replace(/^#![^\n]*(?:\n|$)/, '')
    .replace(/^import[^\n]*\n/, '');
  new Function('__checkpoint_scope', source)(() => {
    if (discovery) {
      return { discovery };
    }
    return undefined;
  });
}
