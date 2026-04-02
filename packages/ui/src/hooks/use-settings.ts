'use client';

import { useCallback, useMemo } from 'react';
import { useLocalStorage } from '@uidotdev/usehooks';

const SETTINGS_KEY = 'viteval:settings';

/**
 * All user-configurable settings for the Viteval UI.
 */
export interface VitevalSettings {
  /** Default page size for data tables */
  pageSize: number;
  /** Timestamp display format */
  timestampFormat: 'relative' | 'absolute' | 'iso';
  /** Auto-refresh interval in seconds (0 = disabled) */
  autoRefreshInterval: number;
  /** Expand JSON objects by default in viewers */
  expandJsonByDefault: boolean;
  /** Maximum number of items to show in charts */
  chartMaxDataPoints: number;
  /** Show line numbers in code/JSON viewers */
  showLineNumbers: boolean;
}

const DEFAULT_SETTINGS: VitevalSettings = {
  autoRefreshInterval: 0,
  chartMaxDataPoints: 50,
  expandJsonByDefault: false,
  pageSize: 20,
  showLineNumbers: true,
  timestampFormat: 'absolute',
};

export type SettingsKey = keyof VitevalSettings;

/**
 * Hook for reading and writing typed, namespaced Viteval UI settings
 * backed by localStorage.
 *
 * @returns Settings state and mutation helpers
 */
export function useSettings() {
  const [settings, setSettings] = useLocalStorage<VitevalSettings>(
    SETTINGS_KEY,
    DEFAULT_SETTINGS
  );

  const merged = useMemo<VitevalSettings>(
    () => ({ ...DEFAULT_SETTINGS, ...settings }),
    [settings]
  );

  const updateSetting = useCallback(
    <K extends SettingsKey>(key: K, value: VitevalSettings[K]) => {
      setSettings((prev) => ({ ...DEFAULT_SETTINGS, ...prev, [key]: value }));
    },
    [setSettings]
  );

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, [setSettings]);

  const exportSettings = useCallback(
    () => JSON.stringify(merged, null, 2),
    [merged]
  );

  const importSettings = useCallback(
    (json: string): { ok: true } | { ok: false; error: string } => {
      try {
        const parsed: unknown = JSON.parse(json);
        if (
          typeof parsed !== 'object' ||
          parsed === null ||
          Array.isArray(parsed)
        ) {
          return { error: 'Settings must be a JSON object', ok: false };
        }

        const next: Record<string, unknown> = { ...DEFAULT_SETTINGS };
        for (const [key, defaultVal] of Object.entries(DEFAULT_SETTINGS)) {
          const incoming = (parsed as Record<string, unknown>)[key];
          if (incoming !== undefined && typeof incoming === typeof defaultVal) {
            next[key] = incoming;
          }
        }

        setSettings(next as unknown as VitevalSettings);
        return { ok: true };
      } catch {
        return { error: 'Invalid JSON', ok: false };
      }
    },
    [setSettings]
  );

  return {
    defaults: DEFAULT_SETTINGS,
    exportSettings,
    importSettings,
    resetSettings,
    settings: merged,
    updateSetting,
  } as const;
}
