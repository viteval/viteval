'use client';

import { cn } from '@/lib/utils';
import { FileTypeIcon } from './file-icon';

interface FilePathProps {
  path: string;
  className?: string;
  showIcon?: boolean;
}

export function FilePath({
  path,
  className,
  showIcon = true,
}: FilePathProps) {
  return (
    <code
      className={cn(
        'inline-flex items-center gap-1.5 min-w-0 max-w-full text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted',
        className
      )}
    >
      {showIcon && <FileTypeIcon path={path} />}
      <span className="truncate">{path}</span>
    </code>
  );
}
