// @vitest-environment jsdom
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { _api, getIcon, Icon } from '@iconify/react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as icons from '@/components/icons';
import { TEST_ICON_NAMES } from './test-icons';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('offline test icons', () => {
  it('should preload every literal component icon and dynamic file-type icon', () => {
    const componentsPath = join(import.meta.dirname, 'components');
    const sources = readdirSync(componentsPath, {
      encoding: 'utf8',
      recursive: true,
    })
      .filter((path) => /\.tsx?$/.test(path) && !/\.test\.tsx?$/.test(path))
      .map((path) => readFileSync(join(componentsPath, path), 'utf8'));
    const literalNames = sources.flatMap((source) =>
      [...source.matchAll(/['"]([a-z][a-z0-9-]*:[a-z][a-z0-9-]*)['"]/g)].map(
        (match) => match[1]
      )
    );
    const fileIconSource = readFileSync(
      join(componentsPath, 'display/file-icon.tsx'),
      'utf8'
    );
    const fileTypeNames = [...fileIconSource.matchAll(/\| '([a-z]+)'/g)].map(
      (match) => `catppuccin:${match[1]}`
    );

    expect(literalNames.length).toBeGreaterThan(0);
    expect(fileTypeNames.length).toBeGreaterThan(0);
    for (const name of [...literalNames, ...fileTypeNames]) {
      expect(TEST_ICON_NAMES, `Missing offline fixture: ${name}`).toContain(
        name
      );
      expect(getIcon(name ?? '')).toBeTruthy();
    }
  });

  it('should render real SVGs without Iconify API requests or callbacks surviving unmount', async () => {
    const originalFetch = _api.getFetch();
    const iconFetch = vi.fn<typeof fetch>(async () => {
      throw new Error('Unexpected Iconify API request');
    });
    vi.useFakeTimers();
    _api.setFetch(iconFetch);

    try {
      const { container, unmount } = render(
        <>
          {TEST_ICON_NAMES.map((name) => (
            <Icon key={name} icon={name} />
          ))}
          {Object.entries(icons).map(([name, Component]) => (
            <Component key={name} />
          ))}
          <icons.CheckIcon role="img" aria-label="Check" aria-hidden={false} />
        </>
      );

      expect(container.querySelectorAll('svg')).toHaveLength(
        TEST_ICON_NAMES.length + Object.keys(icons).length + 1
      );
      expect(screen.getByRole('img', { name: 'Check' }).tagName).toBe('svg');
      expect(iconFetch).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);

      unmount();
      await vi.runAllTimersAsync();
      expect(iconFetch).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      if (originalFetch) {
        _api.setFetch(originalFetch);
      }
    }
  });
});
