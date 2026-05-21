'use client';

import { cn, formatTimestamp } from '@/lib/utils';

interface TimestampProps {
  value: number | string;
  className?: string;
}

export function Timestamp({ value, className }: TimestampProps) {
  return (
    <span className={cn('text-xs text-muted-foreground', className)}>
      {formatTimestamp(value)}
    </span>
  );
}
