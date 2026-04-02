'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark';
import {
  SYNTAX_HIGHLIGHTER_CODE_STYLE,
  SYNTAX_HIGHLIGHTER_LINE_NUMBER_STYLE,
  SYNTAX_HIGHLIGHTER_STYLE,
} from '@/lib/utils';
import { CopyButton } from './copy-button';

interface CodeRendererProps {
  value: string;
  label?: string;
}

const FENCED_BLOCK =
  /```([a-zA-Z0-9#+-]*)\n([\s\S]*?)```/;

/**
 * Extract the language and body from a fenced code block.
 * Falls back to the full string with no language if no fence is found.
 */
function extractCode(value: string): { language: string; body: string } {
  const match = FENCED_BLOCK.exec(value);
  if (match) {
    return {
      body: match[2].trimEnd(),
      language: match[1] || 'text',
    };
  }
  return { body: value, language: 'text' };
}

export function CodeRenderer({ value, label }: CodeRendererProps) {
  const { language, body } = extractCode(value);

  return (
    <div className="relative group">
      {language !== 'text' && (
        <span className="absolute top-2 left-3 text-[10px] font-mono text-zinc-500 z-10">
          {language}
        </span>
      )}
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          ...SYNTAX_HIGHLIGHTER_STYLE,
          paddingTop: language !== 'text' ? '1.75rem' : undefined,
        }}
        codeTagProps={SYNTAX_HIGHLIGHTER_CODE_STYLE}
        showLineNumbers
        lineNumberStyle={SYNTAX_HIGHLIGHTER_LINE_NUMBER_STYLE}
      >
        {body}
      </SyntaxHighlighter>
      <CopyButton content={body} label={label} />
    </div>
  );
}
