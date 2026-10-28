import { ok } from 'massaman/control';
import { TestRunner, afterEach, describe, expect, it, vi } from 'vitest';
import { createProvider } from '#/provider/create';
import VitevalLifecycleRunner from './lifecycle';
import { createProjectRuntime, getProjectRuntime } from './runtime';
import { getExecutionScope, runWithExecution } from './execution';

afterEach(async () => {
  vi.restoreAllMocks();
});

describe('VitevalLifecycleRunner', () => {
  it('should retain engine and provider cleanup failures together', async () => {
    const engineError = new Error('engine cleanup rejected');
    const providerError = new Error('provider cleanup rejected');
    vi.spyOn(TestRunner.prototype, 'onAfterRunFiles').mockImplementation(() => {
      throw engineError;
    });
    const close = vi.fn().mockRejectedValue(providerError);
    const runner = Object.create(
      VitevalLifecycleRunner.prototype
    ) as VitevalLifecycleRunner;
    const executions = new Set([{ read: () => ({ runtime: { close } }) }]);
    Reflect.set(runner, 'executions', executions);
    await expect(runner.onAfterRunFiles([])).rejects.toMatchObject({
      errors: [engineError, providerError],
    });
    expect(close).toHaveBeenCalledExactlyOnceWith();
    expect(executions.size).toBe(0);
  });

  it('should establish ownership before setup imports and retain it through deferred collection', async () => {
    const runtime = createProjectRuntime({ providers: [] });
    const discovery = { register: vi.fn() };
    const runner = Object.create(
      VitevalLifecycleRunner.prototype
    ) as VitevalLifecycleRunner;
    Reflect.set(runner, 'config', { setupFiles: ['/bootstrap', '/setup'] });
    Reflect.set(runner, 'executions', new Set());
    vi.spyOn(TestRunner.prototype, 'importFile').mockImplementation(
      async (file) => {
        expect(getExecutionScope()).toBeDefined();
        if (file === '/bootstrap') {
          return { executionScope: { discovery } };
        }
        if (file === '/setup') {
          expect(getExecutionScope()?.discovery).toBe(discovery);
          return { executionScope: { runtime } };
        }
        return {};
      }
    );
    await runWithExecution({
      scope: {},
      run: async () => {
        await runner.importFile('/bootstrap', 'setup');
        await runner.importFile('/setup', 'setup');
        await runner.importFile('/evaluation', 'collect');
        await Promise.resolve();
        expect(getExecutionScope()).toEqual({ runtime, discovery });
        await runner.importFile('/bootstrap', 'setup');
        expect(getExecutionScope()).toEqual({ discovery });
      },
    });
    expect(getExecutionScope()).toBeUndefined();
    await runtime.close();
  });

  it.each([false, true])(
    'should close runtime resources even when Vitest cleanup fails: %s',
    async (fails) => {
      const events: string[] = [],
        cleanup = vi
          .spyOn(TestRunner.prototype, 'onAfterRunFiles')
          .mockImplementation(() => {
            events.push('vitest');
            if (fails) throw new Error('Vitest cleanup failed');
          }),
        runtime = createProjectRuntime({
          providers: [
            createProvider({
              name: 'json',
              close: async () => {
                events.push('provider');
                return ok(undefined);
              },
            }),
          ],
        });
      await runtime.provider('json');
      const runner = Object.create(
        VitevalLifecycleRunner.prototype
      ) as VitevalLifecycleRunner;
      Reflect.set(
        runner,
        'executions',
        new Set([{ read: () => ({ runtime }) }])
      );
      const completion = runner.onAfterRunFiles([]);
      if (fails) {
        await expect(completion).rejects.toThrow('Vitest cleanup failed');
      } else {
        await completion;
      }
      expect(cleanup).toHaveBeenCalledExactlyOnceWith([]);
      expect(events).toEqual(['vitest', 'provider']);
      expect(getProjectRuntime()).toBeUndefined();
    }
  );
});
