import { type ClassValue, clsx } from 'clsx';
import { isNaN as isNaNFn } from 'lodash-es';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = Number.parseFloat((bytes / k ** i).toFixed(1));
  if (isNaNFn(size)) {
    return 'n/a';
  }

  return `${size} ${sizes[i]}`;
}

export function formatTimestamp(timestamp: string): string {
  const timeNum = Number.parseInt(timestamp, 10);
  if (isNaNFn(timeNum)) {
    return timestamp;
  }

  const date = new Date(timeNum);
  return date.toLocaleString();
}

export function formatDuration(ms: number): string {
  if (ms < 1000 && !isNaNFn(ms)) return `${ms}ms`;
  const seconds = ms / 1000;

  if (isNaNFn(seconds)) {
    return 'n/a';
  }

  return `${seconds.toFixed(2)}s`;
}

export function formatTimestampFromNumber(timestamp: number): string {
  if (isNaNFn(timestamp)) {
    return 'n/a';
  }

  return new Date(timestamp).toLocaleString();
}
