import { type ClassValue, clsx } from 'clsx';
import { format } from 'date-fns';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = Number.parseFloat((bytes / k ** i).toFixed(1));
  if (Number.isNaN(size)) {
    return 'n/a';
  }

  return `${size} ${sizes[i]}`;
}

export function formatTimestamp(timestamp: string | number): string {
  const timeNum =
    typeof timestamp === 'number'
      ? timestamp
      : Number.parseInt(timestamp, 10);
  if (Number.isNaN(timeNum)) {
    return String(timestamp);
  }

  return new Date(timeNum).toLocaleString();
}

export function formatChartTimestamp(timestamp: string | number): string {
  const timeNum =
    typeof timestamp === 'number'
      ? timestamp
      : Number.parseInt(timestamp, 10);
  if (Number.isNaN(timeNum)) {
    return String(timestamp);
  }

  return format(new Date(timeNum), 'M/d HH:mm');
}

export function formatDuration(ms: number): string {
  if (Number.isNaN(ms)) {
    return 'n/a';
  }
  if (ms < 1000) {
    return `${ms.toFixed(3)}ms`;
  }
  const seconds = ms / 1000;

  return `${seconds.toFixed(2)}s`;
}

export function formatPassRate(passed: number, total: number): string {
  if (total === 0) {
    return 'N/A';
  }
  return `${((passed / total) * 100).toFixed(1)}%`;
}

/**
 * Check if a value is JSON-parseable (object, array, or valid JSON string).
 */
export function isJSON(value: unknown): boolean {
  if (value !== null && typeof value === 'object') {
    return true;
  }
  if (typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    trimmed === 'null' ||
    trimmed === 'true' ||
    trimmed === 'false' ||
    !Number.isNaN(Number(trimmed))
  ) {
    try {
      JSON.parse(trimmed);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const SYNTAX_HIGHLIGHTER_STYLE: React.CSSProperties = {
  background: 'rgb(24, 24, 27)',
  borderRadius: '0.375rem',
  fontSize: '0.75rem',
  lineHeight: '1rem',
  margin: 0,
};

export const SYNTAX_HIGHLIGHTER_CODE_STYLE: React.ComponentProps<'code'> = {
  style: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
};

export const SYNTAX_HIGHLIGHTER_LINE_NUMBER_STYLE: React.CSSProperties = {
  color: 'var(--muted-foreground)',
  opacity: 0.5,
};
