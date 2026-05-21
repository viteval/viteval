'use client';

import { CopyButton } from './copy-button';

interface TextRendererProps {
  value: string;
  label?: string;
}

export function TextRenderer({ value, label }: TextRendererProps) {
  return (
    <div className="relative group">
      <div className="bg-zinc-900 text-zinc-100 p-3 rounded-md font-mono text-xs leading-relaxed">
        <pre className="whitespace-pre-wrap break-words m-0">{value}</pre>
      </div>
      <CopyButton content={value} label={label} />
    </div>
  );
}
