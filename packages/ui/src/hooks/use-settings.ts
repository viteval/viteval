import { useCallback, useMemo, useSyncExternalStore } from 'react';

const SETTINGS_KEY = 'viteval:settings';
const SETTINGS_EVENT = 'viteval:settings-changed';

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

const TIMESTAMP_FORMATS: readonly VitevalSettings['timestampFormat'][] = [
  'relative',
  'absolute',
  'iso',
] as const;

export type SettingsKey = keyof VitevalSettings;

/**
 * Hook for reading and writing typed, namespaced Viteval UI settings
 * backed by localStorage.
 *
 * @returns Settings state and mutation helpers
 */
export function useSettings() {
  const storedSettings = useSyncExternalStore(
    subscribeToSettings,
    getStoredSettings,
    () => null
  );

  const settings = useMemo(
    () => parseStoredSettings(storedSettings),
    [storedSettings]
  );
  const setSettings = useCallback(
    (
      update: VitevalSettings | ((previous: VitevalSettings) => VitevalSettings)
    ) => {
      const previous = parseStoredSettings(getStoredSettings());
      const next = typeof update === 'function' ? update(previous) : update;
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(SETTINGS_EVENT));
    },
    []
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

        const incoming = parsed as Record<string, unknown>;
        const next: VitevalSettings = { ...DEFAULT_SETTINGS };

        for (const key of Object.keys(DEFAULT_SETTINGS) as SettingsKey[]) {
          const value = incoming[key];
          if (value === undefined) {
            continue;
          }
          if (
            key === 'timestampFormat' &&
            typeof value === 'string' &&
            (TIMESTAMP_FORMATS as readonly string[]).includes(value)
          ) {
            next.timestampFormat = value as VitevalSettings['timestampFormat'];
            continue;
          }
          if (
            (key === 'autoRefreshInterval' ||
              key === 'chartMaxDataPoints' ||
              key === 'pageSize') &&
            typeof value === 'number' &&
            Number.isFinite(value) &&
            value >= 0
          ) {
            next[key] = value;
            continue;
          }
          if (
            (key === 'expandJsonByDefault' || key === 'showLineNumbers') &&
            typeof value === 'boolean'
          ) {
            next[key] = value;
            continue;
          }
          // Unknown or invalid value — silently drop.
        }

        setSettings(next);
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

function getStoredSettings() {
  return window.localStorage.getItem(SETTINGS_KEY);
}

function parseStoredSettings(value: string | null): VitevalSettings {
  if (!value) {
    return DEFAULT_SETTINGS;
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function subscribeToSettings(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === SETTINGS_KEY || event.key === null) {
      onChange();
    }
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(SETTINGS_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(SETTINGS_EVENT, onChange);
  };
}
