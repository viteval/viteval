'use client';

import { XIcon } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Tag } from '@/types';

interface TagChipProps {
  tag: Tag;
  onRemove?: () => void;
  className?: string;
}

export function TagChip({ tag, onRemove, className }: TagChipProps) {
  const colorStyle = tag.color
    ? { backgroundColor: tag.color, borderColor: tag.color, color: '#fff' }
    : undefined;

  return (
    <Badge
      variant="outline"
      className={cn('text-xs gap-1', className)}
      style={colorStyle}
    >
      <span>{tag.name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="rounded-sm hover:bg-black/10 dark:hover:bg-white/10"
          aria-label={`Remove tag ${tag.name}`}
        >
          <XIcon className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
}
