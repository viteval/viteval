// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ObjectRenderer } from '@/components/value/object-renderer';
import { ValueRenderer } from '@/components/value/value-renderer';

afterEach(cleanup);

describe('ObjectRenderer', () => {
  it('should select an available field when a reused viewer receives a different object', async () => {
    const view = render(<ObjectRenderer value='{"first":"alpha"}' />);
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Fields' }), {
      key: 'Enter',
    });
    expect(await screen.findByText('alpha')).toBeTruthy();
    view.rerender(<ObjectRenderer value='{"second":"beta"}' />);
    expect(await screen.findByText('beta')).toBeTruthy();
    expect(screen.queryByText('Unable to read value at this path.')).toBeNull();
  });
});

describe('ValueRenderer', () => {
  it.each(['42', 'true', 'null', '"answer"'])(
    'should display the original JSON scalar string %s',
    (value) => {
      render(<ValueRenderer value={value} />);
      expect(screen.getByText(value).textContent).toBe(value);
      expect(screen.queryByRole('tab', { name: 'JSON' })).toBeNull();
    }
  );
});
