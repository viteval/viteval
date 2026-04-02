'use client';

import { Clock } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';

interface DurationProps {
  ms: number;
  showIcon?: boolean;
  className?: string;
}

export function Duration({ ms, showIcon = false, className }: DurationProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-sm text-muted-foreground tabular-nums',
        className
      )}
    >
      {showIcon && <Clock className="h-3 w-3 shrink-0" />}
      {formatDuration(ms)}
    </span>
  );
}
