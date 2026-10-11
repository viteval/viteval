import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark';
import { SYNTAX_HIGHLIGHTER_LINE_NUMBER_STYLE } from '@/lib/utils';

interface SourceViewerProps {
  code: string;
  filepath?: string;
  language?: string;
  maxHeight?: string;
}

export function SourceViewer({
  code,
  filepath,
  language = 'typescript',
  maxHeight = '24rem',
}: SourceViewerProps) {
  return (
    <div className="rounded-md overflow-hidden border">
      {filepath && (
        <div className="border-b px-4 py-2 text-xs text-muted-foreground font-mono bg-muted">
          {filepath}
        </div>
      )}
      <div className="overflow-auto" style={{ maxHeight }}>
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          customStyle={{
            background: 'rgb(24, 24, 27)',
            borderRadius: 0,
            fontSize: '0.8rem',
            margin: 0,
            padding: '1rem',
          }}
          codeTagProps={{ style: {} }}
          showLineNumbers
          lineNumberStyle={SYNTAX_HIGHLIGHTER_LINE_NUMBER_STYLE}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
