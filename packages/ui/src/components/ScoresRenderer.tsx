'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SYNTAX_HIGHLIGHTER_CODE_STYLE, SYNTAX_HIGHLIGHTER_LINE_NUMBER_STYLE, SYNTAX_HIGHLIGHTER_STYLE } from '@/lib/utils';
import type { Score } from '../types';

interface ScoresRendererProps {
  scores: Score[];
}

export default function ScoresRenderer({ scores }: ScoresRendererProps) {
  if (scores.length === 0) {
    return <div>No scores</div>;
  }

  if (scores.length === 1) {
    return (
      <SyntaxHighlighter
        language="json"
        style={oneDark}
        customStyle={SYNTAX_HIGHLIGHTER_STYLE}
        codeTagProps={SYNTAX_HIGHLIGHTER_CODE_STYLE}
        showLineNumbers
        lineNumberStyle={SYNTAX_HIGHLIGHTER_LINE_NUMBER_STYLE}
      >
        {JSON.stringify(scores[0], null, 2)}
      </SyntaxHighlighter>
    );
  }

  return (
    <Tabs defaultValue={scores[0].name}>
      <TabsList>
        {scores.map((score) => (
          <TabsTrigger
            key={score.name}
            value={score.name}
            className="cursor-pointer hover:bg-zinc-900"
          >
            {score.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {scores.map((score) => (
        <TabsContent key={score.name} value={score.name}>
          <SyntaxHighlighter
            language="json"
            style={oneDark}
            customStyle={SYNTAX_HIGHLIGHTER_STYLE}
            codeTagProps={SYNTAX_HIGHLIGHTER_CODE_STYLE}
            showLineNumbers
            lineNumberStyle={SYNTAX_HIGHLIGHTER_LINE_NUMBER_STYLE}
          >
            {JSON.stringify(score, null, 2)}
          </SyntaxHighlighter>
        </TabsContent>
      ))}
    </Tabs>
  );
}
