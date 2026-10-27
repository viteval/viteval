// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ScoresRenderer from './ScoresRenderer';

afterEach(cleanup);

describe('ScoresRenderer', () => {
  it('should explain missing scores and render a single score directly', () => {
    const { container, rerender } = render(<ScoresRenderer scores={[]} />);
    expect(screen.getByText('No scores')).toBeTruthy();
    rerender(<ScoresRenderer scores={[{ name: 'exact', score: 1 }]} />);
    expect(screen.queryByRole('tab')).toBeNull();
    expect(container.textContent).toContain('"exact"');
    expect(container.textContent).toContain('1');
  });
  it('should switch between independent scorer details without mixing their metadata', () => {
    render(
      <ScoresRenderer
        scores={[
          { name: 'first', score: 0.2, metadata: { reason: 'first reason' } },
          { name: 'second', score: 0.9, metadata: { reason: 'second reason' } },
        ]}
      />
    );
    expect(screen.getByRole('tabpanel').textContent).toContain('first reason');
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'second' }), {
      button: 0,
      ctrlKey: false,
    });
    expect(screen.getByRole('tabpanel').textContent).toContain('second reason');
    expect(screen.getByRole('tabpanel').textContent).not.toContain(
      'first reason'
    );
  });
});
