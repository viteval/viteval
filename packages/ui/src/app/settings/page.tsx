'use client';

import { useRef, useState } from 'react';
import { DownloadIcon, PencilIcon, RefreshIcon, ConfigIcon, UploadIcon, XIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  type SettingsKey,
  type VitevalSettings,
  useSettings,
} from '@/hooks/use-settings';

interface SettingFieldProps {
  label: string;
  description: string;
  settingsKey: SettingsKey;
  settings: VitevalSettings;
  defaults: VitevalSettings;
  editing: boolean;
  onUpdate: <K extends SettingsKey>(key: K, value: VitevalSettings[K]) => void;
}

function SettingField({
  label,
  description,
  settingsKey,
  settings,
  defaults,
  editing,
  onUpdate,
}: SettingFieldProps) {
  const value = settings[settingsKey];
  const defaultValue = defaults[settingsKey];
  const isDefault = value === defaultValue;

  if (!editing) {
    return (
      <div className="flex items-center justify-between py-3">
        <div className="space-y-0.5">
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
        <div className="text-sm font-mono text-right">
          {String(value)}
          {!isDefault && (
            <span className="ml-2 text-xs text-muted-foreground">
              (default: {String(defaultValue)})
            </span>
          )}
        </div>
      </div>
    );
  }

  if (typeof value === 'boolean') {
    return (
      <div className="flex items-center justify-between py-3">
        <div className="space-y-0.5">
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
        <Select
          value={String(value)}
          onValueChange={(v) =>
            onUpdate(
              settingsKey,
              (v === 'true') as VitevalSettings[typeof settingsKey]
            )
          }
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">true</SelectItem>
            <SelectItem value="false">false</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (settingsKey === 'timestampFormat') {
    return (
      <div className="flex items-center justify-between py-3">
        <div className="space-y-0.5">
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
        <Select
          value={value as string}
          onValueChange={(v) =>
            onUpdate(settingsKey, v as VitevalSettings[typeof settingsKey])
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relative">relative</SelectItem>
            <SelectItem value="absolute">absolute</SelectItem>
            <SelectItem value="iso">iso</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-3">
      <div className="space-y-0.5">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Input
        type="number"
        className="w-28 text-right"
        value={value as number}
        min={0}
        onChange={(e) => {
          const num = Number.parseInt(e.target.value, 10);
          if (!Number.isNaN(num)) {
            onUpdate(settingsKey, num as VitevalSettings[typeof settingsKey]);
          }
        }}
      />
    </div>
  );
}

const SETTING_FIELDS: {
  key: SettingsKey;
  label: string;
  description: string;
}[] = [
  {
    description: 'Number of rows per page in data tables',
    key: 'pageSize',
    label: 'Page Size',
  },
  {
    description: 'How timestamps are displayed across the UI',
    key: 'timestampFormat',
    label: 'Timestamp Format',
  },
  {
    description: 'Seconds between automatic data refreshes (0 to disable)',
    key: 'autoRefreshInterval',
    label: 'Auto-refresh Interval',
  },
  {
    description: 'Auto-expand JSON objects in data viewers',
    key: 'expandJsonByDefault',
    label: 'Expand JSON by Default',
  },
  {
    description: 'Maximum number of data points rendered in charts',
    key: 'chartMaxDataPoints',
    label: 'Chart Max Data Points',
  },
  {
    description: 'Display line numbers in code and JSON viewers',
    key: 'showLineNumbers',
    label: 'Show Line Numbers',
  },
];

export default function SettingsPage() {
  const {
    settings,
    defaults,
    updateSetting,
    resetSettings,
    exportSettings,
    importSettings,
  } = useSettings();

  const [editing, setEditing] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importValue, setImportValue] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = exportSettings();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'viteval-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = () => {
    const result = importSettings(importValue);
    if (result.ok) {
      setImportOpen(false);
      setImportValue('');
      setImportError(null);
    } else {
      setImportError(result.error);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') {
        setImportValue(text);
        setImportError(null);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="container mx-auto p-6 space-y-6 overflow-hidden">
      <PageHeader
        icon={<ConfigIcon className="h-6 w-6" />}
        title="Settings"
        description="Configure your Viteval UI preferences"
        actions={
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(false)}
                >
                  <XIcon className="h-3.5 w-3.5" />
                  Done
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    resetSettings();
                    setEditing(false);
                  }}
                >
                  <RefreshIcon className="h-3.5 w-3.5" />
                  Reset
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <PencilIcon className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Settings are stored in your browser and persist across sessions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {SETTING_FIELDS.map((field) => (
              <SettingField
                key={field.key}
                label={field.label}
                description={field.description}
                settingsKey={field.key}
                settings={settings}
                defaults={defaults}
                editing={editing}
                onUpdate={updateSetting}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import / Export</CardTitle>
          <CardDescription>
            Back up or restore your settings as a JSON file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {importOpen ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadIcon className="h-3.5 w-3.5" />
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleFileImport}
                />
                <span className="text-xs text-muted-foreground">
                  or paste JSON below
                </span>
              </div>
              <textarea
                className="w-full min-h-[120px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                placeholder='{"pageSize": 20, ...}'
                value={importValue}
                onChange={(e) => {
                  setImportValue(e.target.value);
                  setImportError(null);
                }}
              />
              {importError && (
                <p className="text-sm text-destructive">{importError}</p>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Export your current settings to share or back up, or import
              previously exported settings.
            </div>
          )}
        </CardContent>
        <Separator />
        <CardFooter className="flex justify-end gap-2 pt-4">
          {importOpen ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setImportOpen(false);
                  setImportValue('');
                  setImportError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!importValue.trim()}
                onClick={handleImportSubmit}
              >
                Apply
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <DownloadIcon className="h-3.5 w-3.5" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImportOpen(true)}
              >
                <UploadIcon className="h-3.5 w-3.5" />
                Import
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
