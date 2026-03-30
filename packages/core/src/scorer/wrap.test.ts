import { describe, expect, it } from 'vitest';
import { createScorer } from './custom';
import { wrapScorer } from './wrap';

describe('wrapScorer', () => {
  const stringMatch = createScorer<string>({
    name: 'StringMatch',
    score: ({ output, expected }) => ({
      score: output === expected ? 1 : 0,
    }),
  });

  const lengthScorer = createScorer<string>({
    name: 'LengthCheck',
    score: ({ output, expected }) => ({
      metadata: { expectedLen: expected.length, outputLen: output.length },
      score: output.length === expected.length ? 1 : 0,
    }),
  });

  it('should transform expected before passing to inner scorer', async () => {
    const wrapped = wrapScorer(stringMatch, {
      expected: (e: { good: string; bad: string }) => e.good,
    });

    const result = await wrapped({
      expected: { bad: 'strawberry', good: 'banana' },
      input: 'What is the best fruit?',
      output: 'banana',
    });

    expect(result.score).toBe(1);
  });

  it('should return 0 when transformed expected does not match', async () => {
    const wrapped = wrapScorer(stringMatch, {
      expected: (e: { good: string; bad: string }) => e.good,
    });

    const result = await wrapped({
      expected: { bad: 'strawberry', good: 'banana' },
      input: 'test',
      output: 'strawberry',
    });

    expect(result.score).toBe(0);
  });

  it('should transform output before passing to inner scorer', async () => {
    const wrapped = wrapScorer(stringMatch, {
      output: (o: { text: string; confidence: number }) => o.text,
    });

    const result = await wrapped({
      expected: 'hello',
      input: 'test',
      output: { confidence: 0.9, text: 'hello' },
    });

    expect(result.score).toBe(1);
  });

  it('should transform both output and expected', async () => {
    const wrapped = wrapScorer(stringMatch, {
      expected: (e: { answer: string }) => e.answer,
      output: (o: { text: string }) => o.text,
    });

    const result = await wrapped({
      expected: { answer: 'world' },
      input: 'test',
      output: { text: 'world' },
    });

    expect(result.score).toBe(1);
  });

  it('should preserve the inner scorer name', () => {
    const wrapped = wrapScorer(stringMatch, {
      expected: (e: { good: string }) => e.good,
    });

    expect(wrapped.name).toBe('StringMatch');
  });

  it('should pass through metadata from inner scorer', async () => {
    const wrapped = wrapScorer(lengthScorer, {
      expected: (e: { target: string }) => e.target,
    });

    const result = await wrapped({
      expected: { target: 'abcd' },
      input: 'test',
      output: 'wxyz',
    });

    expect(result.score).toBe(1);
    expect(result.metadata?.outputLen).toBe(4);
    expect(result.metadata?.expectedLen).toBe(4);
  });

  it('should pass through extra args to inner scorer', async () => {
    const inner = createScorer({
      name: 'extra-check',
      score: (args) => ({
        metadata: { hadContext: 'context' in args },
        score: 1,
      }),
    });

    const wrapped = wrapScorer(inner, {
      expected: (e: { value: string }) => e.value,
    });

    const result = await wrapped({
      context: 'some context',
      expected: { value: 'test' },
      input: 'test',
      output: 'test',
    });

    expect(result.score).toBe(1);
    expect(result.metadata?.hadContext).toBe(true);
  });

  it('should work with no transforms as a passthrough', async () => {
    const wrapped = wrapScorer(stringMatch, {});

    const result = await wrapped({
      expected: 'hello',
      input: 'test',
      output: 'hello',
    });

    expect(result.score).toBe(1);
  });
});
