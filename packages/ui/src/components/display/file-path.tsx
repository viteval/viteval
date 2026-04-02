'use client';

import { FileCode2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilePathProps {
  path: string;
  className?: string;
  showIcon?: boolean;
}

function getFileIcon(path: string) {
  if (/\.tsx?$/.test(path)) {
    return <FileCode2 className="h-3.5 w-3.5 shrink-0 text-blue-400" />;
  }
  if (/\.jsx?$/.test(path)) {
    return <FileCode2 className="h-3.5 w-3.5 shrink-0 text-yellow-400" />;
  }
  return <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
}

export function FilePath({
  path,
  className,
  showIcon = true,
}: FilePathProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 min-w-0 max-w-full',
        className
      )}
    >
      {showIcon && getFileIcon(path)}
      <code className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted truncate">
        {path}
      </code>
    </span>
  );
}
