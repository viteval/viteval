import { describe, expect, it } from 'vitest';
import { evaluate } from './evaluate';
import { runWithExecution } from '#/config/execution';

describe('evaluation dataset discovery', () => {
  const data = [{ input: 'question', expected: 'answer' }];
  const registered: unknown[] = [];
  let executed = false;
  const discovery = {
    register: (dataset: unknown) => registered.push(dataset),
  };
  runWithExecution({
    scope: { discovery },
    run: () => {
      evaluate('discovery-only evaluation', {
        data,
        task: () => {
          executed = true;
          return 'answer';
        },
        scorers: [
          () => {
            executed = true;
            return { name: 'unused', score: 1 };
          },
        ],
      });
    },
  });
  it('should register data without executing tasks or scorers', () => {
    expect(registered).toEqual([data]);
    expect(executed).toBe(false);
  });
});
