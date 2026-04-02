'use client';

import { FileIcon, JavaScriptIcon, TypeScriptIcon } from '@/components/icons';
import { cn } from '@/lib/utils';

interface FilePathProps {
  path: string;
  className?: string;
  showIcon?: boolean;
}

function getFileBadge(path: string) {
  if (/\.tsx?$/.test(path)) {
    return <TypeScriptIcon className="h-4 w-4 shrink-0" />;
  }
  if (/\.jsx?$/.test(path)) {
    return <JavaScriptIcon className="h-4 w-4 shrink-0" />;
  }
  return <FileIcon className="h-4 w-4 shrink-0" />;
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
      {showIcon && getFileBadge(path)}
      <span className="truncate">{path}</span>
    </code>
  );
}
