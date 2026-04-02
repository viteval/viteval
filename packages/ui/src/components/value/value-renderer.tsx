'use client';

import { detectValueKind } from './detect';
import { CodeRenderer } from './code-renderer';
import { MarkdownRenderer } from './markdown-renderer';
import { ObjectRenderer } from './object-renderer';
import { PrimitiveRenderer } from './primitive-renderer';
import { TextRenderer } from './text-renderer';

interface ValueRendererProps {
  value: unknown;
  className?: string;
  label?: string;
}

export function ValueRenderer({
  value,
  label = 'Value',
}: ValueRendererProps) {
  const kind = detectValueKind(value);

  switch (kind) {
    case 'object': {
      return <ObjectRenderer value={value} label={label} />;
    }
    case 'text': {
      return <TextRenderer value={String(value)} label={label} />;
    }
    case 'markdown': {
      return <MarkdownRenderer value={String(value)} label={label} />;
    }
    case 'code': {
      return <CodeRenderer value={String(value)} label={label} />;
    }
    case 'primitive': {
      return <PrimitiveRenderer value={value} />;
    }
  }
}
