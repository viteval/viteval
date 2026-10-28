// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import DatasetDetail from './DatasetDetail';

afterEach(cleanup);

describe('DatasetDetail', () => {
  it('should expand and collapse input, expected values and metadata while leaving empty rows unexpanded', () => {
    render(
      <DatasetDetail
        dataset={{
          id: 'dataset',
          name: 'Dataset',
          path: 'dataset.json',
          source: 'json',
          data: [
            {
              id: 'complete',
              name: 'Complete case',
              input: 'question',
              expected: 'answer',
              metadata: {
                category: 'science',
                difficulty: 2,
                source: 'manual',
                release: true,
              },
            },
            { id: 'empty', input: undefined },
            {
              id: 'metadata-only',
              input: undefined,
              metadata: { note: 'additional information' },
            },
            { id: 'expected-only', input: undefined, expected: false },
            { id: 'input-only', input: null },
          ],
        }}
      />
    );
    expect(screen.getByText('+1')).toBeTruthy();
    expect(screen.queryByText('Input:')).toBeNull();
    fireEvent.click(screen.getByText('Complete case'));
    expect(screen.getByText('Input:')).toBeTruthy();
    expect(screen.getByText('Expected:')).toBeTruthy();
    expect(screen.getByText('Metadata:')).toBeTruthy();
    fireEvent.click(screen.getByText('Complete case'));
    expect(screen.queryByText('Input:')).toBeNull();
    fireEvent.click(screen.getByText('empty'));
    expect(screen.queryByText('Metadata:')).toBeNull();
    fireEvent.click(screen.getByText('metadata-only'));
    expect(screen.getByText('Metadata:')).toBeTruthy();
    expect(screen.queryByText('Input:')).toBeNull();
    fireEvent.click(screen.getByText('expected-only'));
    expect(screen.getByText('Expected:')).toBeTruthy();
    fireEvent.click(screen.getByText('input-only'));
    expect(screen.getByText('Input:')).toBeTruthy();
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Name' }), {
      button: 0,
      ctrlKey: false,
    });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Asc' }));
    expect(
      screen.getAllByRole('button', {
        name: /Complete case|metadata-only|expected-only|input-only/,
      })[0].textContent
    ).toContain('Complete case');
  });
  it('should explain empty datasets instead of rendering blank rows', () => {
    render(
      <DatasetDetail
        dataset={{
          id: 'empty',
          name: 'Empty',
          path: 'empty.json',
          source: 'json',
          data: [],
        }}
      />
    );
    expect(screen.getByText('No results.')).toBeTruthy();
  });
});
