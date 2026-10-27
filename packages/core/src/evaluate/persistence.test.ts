import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  closeProjectRuntime,
  createProjectRuntime,
  setProjectRuntime,
} from '#/config/runtime';
import { createJsonProvider } from '#/provider/json';
import { evaluate } from './evaluate';

const root = await mkdtemp(path.join(tmpdir(), 'viteval-evaluation-storage-'));
const provider = createJsonProvider({ root });
setProjectRuntime(createProjectRuntime({ root, providers: [provider] }));

afterAll(async () => {
  await closeProjectRuntime();
  await rm(root, { recursive: true, force: true });
});

describe('evaluation persistence', () => {
  describe('completed evaluations', () => {
    evaluate('sum gate', {
      aggregation: 'sum',
      data: [{ input: null, expected: null, context: 'reference' }],
      task: ({ input, context }) => {
        expect(input).toBeNull();
        expect(context).toBe('reference');
        return null;
      },
      scorers: [
        function first() {
          return { name: 'first', score: 0.6 };
        },
        function second() {
          return { name: 'second', score: 0.6 };
        },
      ],
      threshold: 1,
    });

    evaluate('median gate', {
      aggregation: 'median',
      data: [{ input: { question: 'q' }, expected: 'answer' }],
      task: ({ input }) => input.question,
      scorers: [
        function low() {
          return { name: 'low', score: 0.1 };
        },
        function middle() {
          return { name: 'middle', score: 0.8 };
        },
        function high() {
          return { name: 'high', score: 0.9 };
        },
      ],
      threshold: 0.8,
    });

    evaluate('reserved task fields', {
      data: [
        {
          name: 'explicit case name',
          input: 'question',
          expected: 'answer',
          output: 'dataset value is not task output',
          context: 'reference',
        },
      ],
      task: (args) => {
        expect(args).not.toHaveProperty('expected');
        expect(args).not.toHaveProperty('output');
        expect(args.context).toBe('reference');
        return 'answer';
      },
      scorers: [
        function nullable() {
          return { name: 'nullable', score: null };
        },
      ],
      threshold: 0,
    });
  });

  it('should persist final case outcomes using their configured aggregation', async () => {
    const runs = await provider.evals!.list();
    if (!runs.ok) throw runs.error;
    expect(runs.value).toHaveLength(3);
    for (const run of runs.value) {
      expect(run).toMatchObject({
        status: 'completed',
        summary: {
          passed: true,
          passedCount: 1,
          failedCount: 0,
          totalCount: 1,
        },
      });
    }
    const sum = runs.value.find((run) => run.name === 'sum gate');
    expect(sum).toMatchObject({
      config: { aggregation: 'sum', threshold: 1 },
      summary: { meanScore: 0.6, medianScore: 0.6, sumScore: 1.2 },
    });
    const median = runs.value.find((run) => run.name === 'median gate');
    expect(median).toMatchObject({
      config: { aggregation: 'median', threshold: 0.8 },
      summary: { medianScore: 0.8 },
    });
    const reserved = runs.value.find(
      (run) => run.name === 'reserved task fields'
    );
    expect(reserved).toBeDefined();
    const stored = await provider.evals!.get({
      id: reserved!.id,
      includeResults: true,
    });
    expect(stored).toMatchObject({
      ok: true,
      value: {
        results: [
          {
            output: 'answer',
            scores: [{ name: 'nullable', score: 0 }],
            metadata: { name: 'explicit case name', state: 'passed' },
          },
        ],
      },
    });
  });
});
