import { describe, expect, it } from 'vitest';
import {
  bindExecution,
  getExecutionScope,
  runWithExecution,
  startExecution,
} from './execution';

describe('execution ownership', () => {
  it('should restore the caller context after a nested execution', async () => {
    const scope = { discovery: { register() {} } };
    expect(getExecutionScope()).toBeUndefined();
    await runWithExecution({
      scope,
      run: async () => {
        expect(getExecutionScope()).toBe(scope);
        await runWithExecution({
          scope: {},
          run: async () => {
            await Promise.resolve();
            expect(getExecutionScope()).toEqual({});
          },
        });
        expect(getExecutionScope()).toBe(scope);
      },
    });
    expect(getExecutionScope()).toBeUndefined();
  });

  it('should expose setup dependencies to already-created deferred collection', async () => {
    await runWithExecution({
      scope: {},
      run: async () => {
        const owner = startExecution();
        const ready = Promise.withResolvers<void>();
        async function readWhenReady() {
          await ready.promise;
          return getExecutionScope();
        }
        const collected = readWhenReady();
        const discovery = { register() {} };
        owner.include({ discovery });
        ready.resolve();
        expect(await collected).toEqual({ discovery });
        expect(owner.read()).toEqual({ discovery });
      },
    });
  });

  it('should isolate concurrently collected files', async () => {
    const discoveries = [{ register() {} }, { register() {} }];
    const scopes = await Promise.all(
      discoveries.map(async (discovery) =>
        runWithExecution({
          scope: {},
          run: async () => {
            const owner = startExecution();
            owner.include({ discovery });
            await Promise.resolve();
            return getExecutionScope();
          },
        })
      )
    );
    expect(scopes).toEqual(discoveries.map((discovery) => ({ discovery })));
  });

  it('should bind callback dependencies without replacing the invocation context', () => {
    const scope = { discovery: { register() {} } };
    const bound = runWithExecution({
      scope,
      run: () =>
        bindExecution((value: number) => ({
          value,
          scope: getExecutionScope(),
        })),
    });
    expect(bound(42)).toEqual({ value: 42, scope });
    expect(getExecutionScope()).toBeUndefined();
    expect(bindExecution((value: number) => value)(42)).toBe(42);
  });
});
