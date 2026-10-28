import { describe, expect, it } from 'vitest';
import {
  decodeResult,
  decodeRun,
  jsonValue,
  requireRecord,
} from './remote-record';

const summary = {
  meanScore: 1,
  medianScore: 1,
  sumScore: 1,
  passedCount: 1,
  failedCount: 0,
  totalCount: 1,
  passed: true,
};
const run = {
  id: 'run',
  name: 'accuracy',
  status: 'running',
  config: { aggregation: 'mean', threshold: 1, scorerNames: ['exact'] },
  metadata: {},
  startedAt: '2026-10-01T00:00:00.000Z',
};
const result = {
  id: 'result',
  evalRunId: 'run',
  passed: true,
  meanScore: 1,
  medianScore: 1,
  sumScore: 1,
  scores: [{ name: 'exact', score: 1 }],
  metadata: {},
};

describe('provider snapshots', () => {
  it.each([null, undefined, false, 1, 'text', []])(
    'should reject non-record metadata %s',
    (value) => {
      expect(() => requireRecord(value)).toThrow(
        'Invalid provider metadata record'
      );
    }
  );
  it('should copy records without retaining their prototype', () => {
    const value = { key: 'value' };
    expect(requireRecord(value)).toEqual(value);
    expect(requireRecord(value)).not.toBe(value);
  });
  it.each(['running', 'completed', 'failed'])(
    'should decode %s runs and restore optional fields',
    (status) => {
      expect(
        decodeRun(
          JSON.stringify({
            ...run,
            status,
            datasetId: 'dataset',
            config: {
              ...run.config,
              aggregation: status === 'running' ? 'median' : 'sum',
              timeout: 10,
            },
            completedAt: run.startedAt,
            summary,
          })
        )
      ).toMatchObject({
        status,
        datasetId: 'dataset',
        config: { timeout: 10 },
        completedAt: new Date(run.startedAt),
        summary,
      });
      expect(decodeRun(run)).toMatchObject({
        startedAt: new Date(run.startedAt),
        completedAt: undefined,
        summary: undefined,
        datasetId: undefined,
      });
    }
  );
  it.each(['id', 'name', 'status'])('should reject invalid run %s', (key) => {
    expect(() => decodeRun({ ...run, [key]: null })).toThrow(
      'Invalid provider run snapshot'
    );
  });
  it.each([
    { aggregation: 'invalid' },
    { threshold: Infinity },
    { scorerNames: null },
    { scorerNames: [1] },
  ])('should reject invalid run config %s', (config) => {
    expect(() =>
      decodeRun({ ...run, config: { ...run.config, ...config } })
    ).toThrow('Invalid provider run snapshot');
  });
  it.each([null, 'not-a-date', 1])(
    'should reject invalid timestamps %s',
    (startedAt) => {
      expect(() => decodeRun({ ...run, startedAt })).toThrow(
        'Invalid provider timestamp'
      );
    }
  );
  it.each([
    'meanScore',
    'medianScore',
    'sumScore',
    'passedCount',
    'failedCount',
    'totalCount',
    'passed',
  ])('should reject invalid summary %s', (key) => {
    expect(() =>
      decodeRun({ ...run, summary: { ...summary, [key]: null } })
    ).toThrow('Invalid provider summary snapshot');
  });
  it('should restore result scores and optional metadata and duration', () => {
    expect(decodeResult(result)).toMatchObject({
      duration: undefined,
      scores: [{ name: 'exact', score: 1, metadata: undefined }],
    });
    expect(
      decodeResult(
        JSON.stringify({
          ...result,
          duration: 20,
          scores: [{ name: 'exact', score: 1, metadata: { reason: 'equal' } }],
        })
      )
    ).toMatchObject({
      duration: 20,
      scores: [{ metadata: { reason: 'equal' } }],
    });
  });
  it.each([
    'id',
    'evalRunId',
    'passed',
    'meanScore',
    'medianScore',
    'sumScore',
    'scores',
  ])('should reject invalid result %s', (key) => {
    expect(() => decodeResult({ ...result, [key]: null })).toThrow(
      'Invalid provider result snapshot'
    );
  });
  it.each([
    { name: 1, score: 1 },
    { name: 'exact', score: NaN },
  ])('should reject invalid score %s', (score) => {
    expect(() => decodeResult({ ...result, scores: [score] })).toThrow(
      'Invalid provider score snapshot'
    );
  });
  it('should normalize dates and reject lossy JSON values', () => {
    expect(jsonValue({ date: new Date(run.startedAt) })).toEqual({
      date: run.startedAt,
    });
    expect(() => jsonValue({ value: Infinity })).toThrow();
  });
});
