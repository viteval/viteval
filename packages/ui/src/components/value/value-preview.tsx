'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { type ValueKind, detectValueKind, getKindLabel } from './detect';

interface ValuePreviewProps {
  value: unknown;
  maxLength?: number;
  className?: string;
}

const KIND_COLORS: Record<ValueKind, string> = {
  code: 'text-amber-500 border-amber-500/30',
  markdown: 'text-green-500 border-green-500/30',
  object: 'text-blue-500 border-blue-500/30',
  primitive: 'text-purple-500 border-purple-500/30',
  text: 'text-muted-foreground border-muted',
};

function truncate(value: unknown, max: number): string {
  if (value === undefined) {
    return '';
  }
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'string') {
    return value.length > max ? `${value.substring(0, max)}…` : value;
  }
  if (typeof value === 'object') {
    const json = JSON.stringify(value);
    return json.length > max ? `${json.substring(0, max)}…` : json;
  }
  return String(value);
}

export function ValuePreview({
  value,
  maxLength = 60,
  className,
}: ValuePreviewProps) {
  const kind = detectValueKind(value);
  const preview = truncate(value, maxLength);
  const label = getKindLabel(kind);

  return (
    <span className={cn('inline-flex items-center gap-1.5 min-w-0', className)}>
      <Badge
        variant="outline"
        className={cn(
          'shrink-0 px-1 py-0 text-[10px] font-mono leading-4',
          KIND_COLORS[kind]
        )}
      >
        {label}
      </Badge>
      <span className="text-xs truncate text-muted-foreground">{preview}</span>
    </span>
  );
}
