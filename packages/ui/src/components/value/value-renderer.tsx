'use client';

import { match } from 'ts-pattern';
import { detectValueKind } from './detect';
import { CodeRenderer } from './code-renderer';
import { MarkdownRenderer } from './markdown-renderer';
import { ObjectRenderer } from './object-renderer';
import { PrimitiveRenderer } from './primitive-renderer';
import { TextRenderer } from './text-renderer';

interface ValueRendererProps {
  value: unknown;
  label?: string;
}

export function ValueRenderer({ value, label = 'Value' }: ValueRendererProps) {
  return match(detectValueKind(value))
    .with('object', () => <ObjectRenderer value={value} label={label} />)
    .with('text', () => <TextRenderer value={String(value)} label={label} />)
    .with('markdown', () => (
      <MarkdownRenderer value={String(value)} label={label} />
    ))
    .with('code', () => <CodeRenderer value={String(value)} label={label} />)
    .with('primitive', () => <PrimitiveRenderer value={value} />)
    .exhaustive();
}
