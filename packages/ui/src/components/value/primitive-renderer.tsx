'use client';

interface PrimitiveRendererProps {
  value: unknown;
}

export function PrimitiveRenderer({ value }: PrimitiveRendererProps) {
  const display =
    value === null || value === undefined ? 'null' : String(value);

  return (
    <code className="inline-block bg-muted px-2 py-1 rounded text-xs font-mono text-foreground">
      {display}
    </code>
  );
}
