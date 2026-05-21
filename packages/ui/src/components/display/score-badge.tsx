'use client';

import { cn } from '@/lib/utils';

interface ScoreBadgeProps {
  score: number;
  threshold?: number;
  precision?: number;
  className?: string;
}

export function ScoreBadge({
  score,
  threshold,
  precision = 3,
  className,
}: ScoreBadgeProps) {
  const passed = threshold !== undefined ? score >= threshold : undefined;

  return (
    <span
      className={cn(
        'text-sm font-mono tabular-nums',
        passed === true && 'text-green-500',
        passed === false && 'text-red-500',
        className
      )}
    >
      {score.toFixed(precision)}
    </span>
  );
}
