// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { useSettings } from './use-settings';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('useSettings', () => {
  it('should render default settings during SSR without accessing localStorage', () => {
    function Settings() {
      const { settings } = useSettings();
      return <span>{settings.pageSize}</span>;
    }
    localStorage.setItem('viteval:settings', JSON.stringify({ pageSize: 50 }));
    expect(renderToString(<Settings />)).toBe('<span>20</span>');
  });

  it('should restore persisted settings and synchronize updates across consumers', () => {
    localStorage.setItem('viteval:settings', JSON.stringify({ pageSize: 50 }));
    const first = renderHook(useSettings);
    const second = renderHook(useSettings);
    expect(first.result.current.settings.pageSize).toBe(50);
    act(() => first.result.current.updateSetting('pageSize', 100));
    expect(second.result.current.settings.pageSize).toBe(100);
    expect(
      JSON.parse(localStorage.getItem('viteval:settings') ?? '{}').pageSize
    ).toBe(100);
    act(() => second.result.current.resetSettings());
    expect(first.result.current.settings.pageSize).toBe(20);
  });
});
