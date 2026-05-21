import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Stat } from './stat';

export interface StatItem {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
}

interface StatRowProps {
  items: StatItem[];
  variant?: 'inline' | 'card';
}

export function StatRow({ items, variant = 'card' }: StatRowProps) {
  const content = (
    <div className="flex divide-x">
      {items.map((item) => (
        <Stat
          key={item.label}
          label={item.label}
          value={item.value}
          icon={item.icon}
          className="flex-1 px-4 first:pl-0 last:pr-0"
        />
      ))}
    </div>
  );

  if (variant === 'inline') {
    return content;
  }

  return (
    <Card>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
