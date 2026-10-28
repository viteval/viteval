// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useIsMobile } from './use-mobile';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('useIsMobile', () => {
  it('should react to breakpoint changes and unsubscribe the same listener on unmount', () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ addEventListener, removeEventListener }))
    );
    vi.stubGlobal('innerWidth', 1024);
    const { result, unmount } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
    const onChange: () => void = addEventListener.mock.calls[0][1];
    act(() => {
      vi.stubGlobal('innerWidth', 767);
      onChange();
    });
    expect(result.current).toBe(true);
    act(() => {
      vi.stubGlobal('innerWidth', 768);
      onChange();
    });
    expect(result.current).toBe(false);
    unmount();
    expect(removeEventListener).toHaveBeenCalledWith('change', onChange);
  });
});
