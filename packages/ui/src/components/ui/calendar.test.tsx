// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Calendar } from './calendar';

afterEach(cleanup);

describe('Calendar', () => {
  it('should navigate dropdown months and select a range while displaying week numbers', () => {
    const onSelect = vi.fn();
    const { container } = render(
      <Calendar
        mode="range"
        captionLayout="dropdown"
        defaultMonth={new Date(2026, 9, 1)}
        startMonth={new Date(2026, 0, 1)}
        endMonth={new Date(2026, 11, 31)}
        showWeekNumber
        onSelect={onSelect}
        selected={{ from: new Date(2026, 9, 10), to: new Date(2026, 9, 12) }}
      />
    );
    expect(
      screen.getByRole('option', {
        name: new Date(2026, 9, 1).toLocaleString('default', {
          month: 'short',
        }),
      })
    ).toBeTruthy();
    expect(container.querySelector('[data-range-start=true]')).toBeTruthy();
    expect(container.querySelector('[data-range-middle=true]')).toBeTruthy();
    expect(container.querySelector('[data-range-end=true]')).toBeTruthy();
    fireEvent.change(screen.getByRole('combobox', { name: /month/i }), {
      target: { value: '10' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /November 16th, 2026/ })
    );
    expect(onSelect).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /previous month/i }));
    expect(
      screen.getByRole('button', { name: /October 16th, 2026/ })
    ).toBeTruthy();
  });

  it('should focus and move the selected day with the keyboard', () => {
    render(
      <Calendar
        mode="single"
        defaultMonth={new Date(2026, 9, 1)}
        selected={new Date(2026, 9, 15)}
        autoFocus
      />
    );
    const day = screen.getByRole('button', { name: /October 15th, 2026/ });
    expect(document.activeElement).toBe(day);
    fireEvent.keyDown(day, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: /October 16th, 2026/ })
    );
  });
});
