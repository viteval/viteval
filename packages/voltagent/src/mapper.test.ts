import { describe, expect, it } from 'vitest';
import { mapVoltagentItem, mapVoltagentItems } from './mapper';
import type { ExperimentDatasetItem } from './types';

describe('mapVoltagentItem', () => {
  it('should map basic fields correctly', () => {
    const input: ExperimentDatasetItem<string, string> = {
      id: 'item-1',
      input: 'What is 2+2?',
      expected: '4',
      label: 'Math Question',
    };

    const result = mapVoltagentItem(input);

    expect(result.input).toBe('What is 2+2?');
    expect(result.expected).toBe('4');
    expect(result.name).toBe('Math Question');
    expect(result.id).toBe('item-1');
  });

  it('should use input as expected when expected is undefined', () => {
    const input: ExperimentDatasetItem<string, string> = {
      id: 'item-1',
      input: 'test-input',
    };

    const result = mapVoltagentItem(input);

    expect(result.input).toBe('test-input');
    expect(result.expected).toBe('test-input');
  });

  it('should map metadata correctly', () => {
    const input: ExperimentDatasetItem = {
      id: 'item-1',
      input: 'test',
      metadata: { key: 'value', count: 42 },
    };

    const result = mapVoltagentItem(input);

    expect(result.metadata).toEqual({ key: 'value', count: 42 });
  });

  it('should map dataset identifiers correctly', () => {
    const input: ExperimentDatasetItem = {
      id: 'item-1',
      input: 'test',
      datasetId: 'ds-123',
      datasetVersionId: 'v-456',
      datasetName: 'My Dataset',
    };

    const result = mapVoltagentItem(input);

    expect(result.datasetId).toBe('ds-123');
    expect(result.datasetVersionId).toBe('v-456');
    expect(result.datasetName).toBe('My Dataset');
  });

  it('should merge extra fields into result', () => {
    const input: ExperimentDatasetItem = {
      id: 'item-1',
      input: 'test',
      extra: { customField: 'custom-value', nested: { a: 1 } },
    };

    const result = mapVoltagentItem(input);

    expect(result.customField).toBe('custom-value');
    expect(result.nested).toEqual({ a: 1 });
  });

  it('should preserve raw data', () => {
    const rawData = { originalFormat: true, data: [1, 2, 3] };
    const input: ExperimentDatasetItem = {
      id: 'item-1',
      input: 'test',
      raw: rawData,
    };

    const result = mapVoltagentItem(input);

    expect(result.raw).toEqual(rawData);
  });

  it('should handle null label gracefully', () => {
    const input: ExperimentDatasetItem = {
      id: 'item-1',
      input: 'test',
      label: null,
    };

    const result = mapVoltagentItem(input);

    expect(result.name).toBeUndefined();
  });
});

describe('mapVoltagentItems', () => {
  it('should map an array of items', () => {
    const items: ExperimentDatasetItem<string, string>[] = [
      { id: '1', input: 'q1', expected: 'a1', label: 'Question 1' },
      { id: '2', input: 'q2', expected: 'a2', label: 'Question 2' },
      { id: '3', input: 'q3', expected: 'a3', label: 'Question 3' },
    ];

    const result = mapVoltagentItems(items);

    expect(result).toHaveLength(3);
    expect(result[0].input).toBe('q1');
    expect(result[1].input).toBe('q2');
    expect(result[2].input).toBe('q3');
  });

  it('should return empty array for empty input', () => {
    const result = mapVoltagentItems([]);

    expect(result).toEqual([]);
  });

  it('should preserve type inference', () => {
    const items: ExperimentDatasetItem<
      { query: string },
      { answer: string }
    >[] = [
      {
        id: '1',
        input: { query: 'test query' },
        expected: { answer: 'test answer' },
      },
    ];

    const result = mapVoltagentItems<{ query: string }, { answer: string }>(
      items
    );

    expect(result[0].input.query).toBe('test query');
    expect(result[0].expected.answer).toBe('test answer');
  });
});
