import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  size?: 'sm' | 'lg';
  className?: string;
}

export function Stat({ label, value, icon, size = 'sm', className }: StatProps) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            'text-muted-foreground',
            size === 'lg' ? 'text-sm font-medium' : 'text-xs'
          )}
        >
          {label}
        </span>
        {icon && (
          <span className="text-muted-foreground">{icon}</span>
        )}
      </div>
      <div
        className={cn('font-bold', size === 'lg' ? 'text-2xl' : 'text-xl')}
      >
        {value}
      </div>
    </div>
  );
}
