import { describe, expect, it } from 'vitest';
import { evaluate } from './evaluate';

describe('evaluation dataset discovery', () => {
  const data = [{ input: 'question', expected: 'answer' }];
  const registered: unknown[] = [];
  let executed = false;
  globalThis.__viteval_datasetDiscovery = {
    register: (dataset) => registered.push(dataset),
  };
  try {
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
  } finally {
    globalThis.__viteval_datasetDiscovery = undefined;
  }
  it('should register data without executing tasks or scorers', () => {
    expect(registered).toEqual([data]);
    expect(executed).toBe(false);
  });
});
