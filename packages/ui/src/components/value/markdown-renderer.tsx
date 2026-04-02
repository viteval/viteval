'use client';

import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  SYNTAX_HIGHLIGHTER_CODE_STYLE,
  SYNTAX_HIGHLIGHTER_LINE_NUMBER_STYLE,
  SYNTAX_HIGHLIGHTER_STYLE,
} from '@/lib/utils';
import { CopyButton } from './copy-button';

interface MarkdownRendererProps {
  value: string;
  label?: string;
}

export function MarkdownRenderer({ value, label }: MarkdownRendererProps) {
  return (
    <div className="relative group">
      <Tabs defaultValue="rendered">
        <TabsList>
          <TabsTrigger value="rendered" className="cursor-pointer">
            Rendered
          </TabsTrigger>
          <TabsTrigger value="source" className="cursor-pointer">
            Source
          </TabsTrigger>
        </TabsList>
        <TabsContent value="rendered">
          <div className="prose prose-sm dark:prose-invert max-w-none bg-zinc-900 text-zinc-100 p-4 rounded-md">
            <ReactMarkdown
              components={{
                code: ({ className: codeClassName, children }) => {
                  const match = /language-([a-z0-9#+-]+)/i.exec(
                    codeClassName ?? ''
                  );
                  const language = match ? match[1] : '';

                  if (language) {
                    return (
                      <SyntaxHighlighter
                        language={language}
                        style={oneDark}
                        customStyle={SYNTAX_HIGHLIGHTER_STYLE}
                        codeTagProps={SYNTAX_HIGHLIGHTER_CODE_STYLE}
                        showLineNumbers
                        lineNumberStyle={SYNTAX_HIGHLIGHTER_LINE_NUMBER_STYLE}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    );
                  }

                  return (
                    <code className="bg-zinc-800 px-1 py-0.5 rounded text-xs text-zinc-200">
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => <>{children}</>,
              }}
            >
              {value}
            </ReactMarkdown>
          </div>
          <CopyButton content={value} label={label} />
        </TabsContent>
        <TabsContent value="source">
          <div className="bg-zinc-900 text-zinc-100 p-3 rounded-md font-mono text-xs leading-relaxed">
            <pre className="whitespace-pre-wrap break-words m-0">{value}</pre>
          </div>
          <CopyButton content={value} label={label} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
