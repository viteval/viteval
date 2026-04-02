'use client';

import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilePathProps {
  path: string;
  className?: string;
  showIcon?: boolean;
}

function TsBadge() {
  return (
    <span className="inline-flex items-center justify-center h-4 w-5 shrink-0 rounded-sm bg-blue-600 text-white text-[9px] font-bold leading-none">
      TS
    </span>
  );
}

function JsBadge() {
  return (
    <span className="inline-flex items-center justify-center h-4 w-5 shrink-0 rounded-sm bg-yellow-500 text-black text-[9px] font-bold leading-none">
      JS
    </span>
  );
}

function getFileBadge(path: string) {
  if (/\.tsx?$/.test(path)) {
    return <TsBadge />;
  }
  if (/\.jsx?$/.test(path)) {
    return <JsBadge />;
  }
  return <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
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
