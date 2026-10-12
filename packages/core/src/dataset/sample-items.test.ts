import { describe, expect, it } from 'vitest';
import { sampleItems } from './sample-items';

describe('sampleItems', () => {
  it('should call item function count times and return correct number of items', async () => {
    const result = sampleItems({
      count: 5,
      item: (index) => ({
        expected: `answer-${index}`,
        input: `prompt-${index}`,
      }),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const items = await result.value();

    expect(items).toHaveLength(5);
  });

  it('should pass correct 0-based index to each call', async () => {
    const indices: number[] = [];
    const result = sampleItems({
      count: 3,
      item: (index) => {
        indices.push(index);
        return { expected: 'answer', input: 'prompt' };
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    await result.value();

    expect(indices).toEqual([0, 1, 2]);
  });

  it('should preserve item types and values', async () => {
    const result = sampleItems({
      count: 2,
      item: (index) => ({
        expected: `expected-${index}`,
        input: `input-${index}`,
        metadata: { index },
      }),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const items = await result.value();

    expect(items).toEqual([
      { expected: 'expected-0', input: 'input-0', metadata: { index: 0 } },
      { expected: 'expected-1', input: 'input-1', metadata: { index: 1 } },
    ]);
  });

  it('should work with async item functions', async () => {
    const result = sampleItems({
      count: 3,
      item: async (index) => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return { expected: `async-${index}`, input: `async-${index}` };
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const items = await result.value();

    expect(items).toHaveLength(3);
    expect(items[0]).toEqual({ expected: 'async-0', input: 'async-0' });
  });

  it('should call items sequentially, not in parallel', async () => {
    const callOrder: number[] = [];
    const result = sampleItems({
      count: 3,
      item: async (index) => {
        callOrder.push(index);
        await new Promise((resolve) => setTimeout(resolve, 10));
        callOrder.push(index);
        return { expected: String(index), input: String(index) };
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    await result.value();

    expect(callOrder).toEqual([0, 0, 1, 1, 2, 2]);
  });

  it('should return an error if count is less than 1', () => {
    const result = sampleItems({
      count: 0,
      item: () => ({ expected: '', input: '' }),
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error?.message).toBe(
      'sampleItems: count must be a positive integer (>= 1), received 0'
    );
  });

  it('should return an error if count is Infinity', () => {
    const result = sampleItems({
      count: Infinity,
      item: () => ({ expected: '', input: '' }),
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error?.message).toBe(
      'sampleItems: count must be a positive integer (>= 1), received Infinity'
    );
  });

  it('should return an error if count is fractional', () => {
    const result = sampleItems({
      count: 2.5,
      item: () => ({ expected: '', input: '' }),
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error?.message).toBe(
      'sampleItems: count must be a positive integer (>= 1), received 2.5'
    );
  });
});
