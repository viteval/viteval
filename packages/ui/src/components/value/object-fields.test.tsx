// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ObjectRenderer } from './object-renderer';

afterEach(cleanup);

describe('object field inspection', () => {
  it.each([
    null,
    false,
    12,
    {},
    { nested: { count: 1 }, missing: null },
    'false',
  ])(
    'should explain objects without inspectable string fields: %j',
    (value) => {
      render(<ObjectRenderer value={value} />);
      fireEvent.keyDown(screen.getByRole('tab', { name: 'Fields' }), {
        key: 'Enter',
      });
      expect(screen.getByText('No string fields to display.')).toBeTruthy();
    }
  );

  it.each([
    { value: ['array text', null, 4], expected: 'array text' },
    { value: { nested: { items: ['nested text'] } }, expected: 'nested text' },
    {
      value: { markdown: '# Field heading\n\n**Important**' },
      expected: 'Field heading',
    },
    {
      value: { code: '```typescript\nconst answer = 42;\n```' },
      expected: 'const answer = 42;',
    },
    { value: { json: '{"answer":42}' }, expected: 'answer' },
  ])(
    'should inspect nested and formatted string fields: $expected',
    ({ value, expected }) => {
      render(<ObjectRenderer value={value} />);
      fireEvent.keyDown(screen.getByRole('tab', { name: 'Fields' }), {
        key: 'Enter',
      });
      expect(
        screen.getByRole('tabpanel', { name: 'Fields' }).textContent
      ).toContain(expected);
    }
  );
});
