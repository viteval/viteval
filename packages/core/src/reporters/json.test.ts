import type { DangerouslyAllowAny } from '@viteval/internal';
import { describe, expect, it, vi } from 'vitest';
import JsonReporter from './json';

describe('JsonReporter', () => {
  it('should include input, expected, and output in evaluation results', () => {
    const reporter = new JsonReporter();
    const mockFiles: DangerouslyAllowAny[] = [
      {
        filepath: '/test/eval.ts',
        name: 'Test Suite',
        result: {
          startTime: 1000,
          endTime: 2000,
          state: 'pass',
        },
        tasks: [
          {
            name: 'Test Eval',
            meta: {
              results: [
                {
                  name: 'test-1',
                  sum: 3,
                  mean: 1,
                  median: 1,
                  threshold: 0.8,
                  aggregation: 'mean',
                  scores: [
                    { name: 'scorer-1', score: 1 },
                    { name: 'scorer-2', score: 1 },
                    { name: 'scorer-3', score: 1 },
                  ],
                  input: 'test input',
                  expected: 'expected output',
                  output: 'actual output',
                  metadata: { customField: 'customValue' },
                },
                {
                  name: 'test-2',
                  sum: 2,
                  mean: 0.67,
                  median: 0.5,
                  threshold: 0.8,
                  aggregation: 'mean',
                  scores: [
                    { name: 'scorer-1', score: 1 },
                    { name: 'scorer-2', score: 0.5 },
                    { name: 'scorer-3', score: 0.5 },
                  ],
                  input: { prompt: 'complex input' },
                  expected: { response: 'expected response' },
                  output: { response: 'actual response' },
                },
              ],
            },
          },
        ],
      },
    ];

    const writeFileSpy = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);

    reporter.onInit();
    reporter.onFinished(mockFiles);

    expect(writeFileSpy).toHaveBeenCalled();
    const output = writeFileSpy.mock.calls[0][0] as string;
    const results = JSON.parse(output);

    expect(results.evalResults).toHaveLength(1);
    const suiteResult = results.evalResults[0];

    expect(suiteResult.evalResults).toHaveLength(2);

    const firstEval = suiteResult.evalResults[0];
    expect(firstEval.input).toBe('test input');
    expect(firstEval.expected).toBe('expected output');
    expect(firstEval.output).toBe('actual output');
    expect(firstEval.metadata).toEqual({ customField: 'customValue' });

    const secondEval = suiteResult.evalResults[1];
    expect(secondEval.input).toEqual({ prompt: 'complex input' });
    expect(secondEval.expected).toEqual({ response: 'expected response' });
    expect(secondEval.output).toEqual({ response: 'actual response' });

    writeFileSpy.mockRestore();
  });

  it('should write results to file when outputFile is specified', () => {
    const fs = require('node:fs');
    const writeFileSyncSpy = vi
      .spyOn(fs, 'writeFileSync')
      .mockImplementation(() => {});
    const existsSyncSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(true);

    const reporter = new JsonReporter({ outputFile: '/tmp/test-results.json' });
    const mockFiles: DangerouslyAllowAny[] = [
      {
        filepath: '/test/eval.ts',
        name: 'Test Suite',
        result: {
          startTime: 1000,
          endTime: 2000,
          state: 'pass',
        },
        meta: {
          results: [
            {
              name: 'test-1',
              sum: 1,
              mean: 1,
              median: 1,
              threshold: 0.8,
              aggregation: 'mean',
              scores: [{ name: 'scorer-1', score: 1 }],
              input: 'test',
              expected: 'TEST',
              output: 'TEST',
            },
          ],
        },
      },
    ];

    reporter.onInit();
    reporter.onFinished(mockFiles);

    expect(writeFileSyncSpy).toHaveBeenCalled();
    const writtenData = writeFileSyncSpy.mock.calls[0][1] as string;
    const results = JSON.parse(writtenData);

    expect(results.evalResults[0].evalResults[0].input).toBe('test');
    expect(results.evalResults[0].evalResults[0].expected).toBe('TEST');
    expect(results.evalResults[0].evalResults[0].output).toBe('TEST');

    writeFileSyncSpy.mockRestore();
    existsSyncSpy.mockRestore();
  });
});
