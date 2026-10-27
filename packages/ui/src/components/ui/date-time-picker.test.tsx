// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DateTimePicker } from './date-time-picker';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('DateTimePicker', () => {
  it('should preserve the selected date while changing time and leave the caller value immutable', () => {
    const initial = new Date(2026, 9, 15, 10, 30);
    const onChange = vi.fn();
    const { container } = render(
      <DateTimePicker value={initial} onChange={onChange} />
    );
    fireEvent.click(screen.getByRole('button', { name: /Oct 15, 2026/ }));
    const time = document.querySelector('input[type=time]');
    if (!(time instanceof HTMLInputElement))
      throw new Error('Missing time input');
    fireEvent.change(time, { target: { value: '' } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.change(time, { target: { value: '14:45' } });
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 9, 15, 14, 45));
    expect(initial.getHours()).toBe(10);
    expect(container.textContent).toContain('10:30');
  });
  it('should select and clear a calendar date without discarding its existing time', () => {
    const onChange = vi.fn();
    function Picker() {
      const [value, setValue] = useState<Date | undefined>(
        new Date(2026, 9, 15, 10, 30)
      );
      return (
        <DateTimePicker
          value={value}
          onChange={(next) => {
            onChange(next);
            setValue(next);
          }}
        />
      );
    }
    render(<Picker />);
    fireEvent.click(screen.getByRole('button', { name: /Oct 15, 2026/ }));
    const date = screen.getByRole('button', { name: /October 16th, 2026/ });
    fireEvent.click(date);
    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 9, 16, 10, 30));
    fireEvent.click(screen.getByRole('button', { name: /October 16th, 2026/ }));
    expect(onChange).toHaveBeenLastCalledWith(undefined);
    expect(
      screen.getByRole('button', { name: /Pick date & time/ })
    ).toBeTruthy();
  });
  it('should use today when a time is entered before a calendar date', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 15, 12));
    const onChange = vi.fn();
    render(<DateTimePicker onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Pick date & time/ }));
    const time = document.querySelector('input[type=time]');
    if (!time) throw new Error('Missing time input');
    fireEvent.change(time, { target: { value: '08:05' } });
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 9, 15, 8, 5));
  });
});
