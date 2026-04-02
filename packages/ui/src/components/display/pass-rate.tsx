'use client';

import { cn, formatPassRate } from '@/lib/utils';

interface PassRateProps {
  passed: number;
  total: number;
  showFraction?: boolean;
  className?: string;
}

export function PassRate({
  passed,
  total,
  showFraction = false,
  className,
}: PassRateProps) {
  const rate = formatPassRate(passed, total);

  return (
    <span className={cn('text-sm tabular-nums', className)}>
      {showFraction && (
        <>
          {passed}/{total}{' '}
          {total > 0 && (
            <span className="text-muted-foreground">({rate})</span>
          )}
        </>
      )}
      {!showFraction && rate}
    </span>
  );
}
