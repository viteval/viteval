import { ok } from 'massaman/control';
import { TestRunner, afterEach, describe, expect, it, vi } from 'vitest';
import { createProvider } from '#/provider/create';
import VitevalLifecycleRunner from './lifecycle';
import {
  closeProjectRuntime,
  createProjectRuntime,
  getProjectRuntime,
  setProjectRuntime,
} from './runtime';

afterEach(async () => {
  vi.restoreAllMocks();
  await closeProjectRuntime();
});

describe('VitevalLifecycleRunner', () => {
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
      setProjectRuntime(runtime);
      await runtime.provider('json');
      // Exercise our override without constructing another Vitest worker runner.
      const completion = VitevalLifecycleRunner.prototype.onAfterRunFiles([]);
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
