
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Score } from '../types';

interface ScoresRendererProps {
  scores: Score[]
}

function ScoresRenderer({ scores }: ScoresRendererProps) {

  if (scores.length === 0) {
    return <div>No scores</div>
  }

  if (scores.length === 1) {
    return (
      <div>
        <SyntaxHighlighter language={'json'} style={oneDark} customStyle={{ margin: 0, borderRadius: '0.375rem', fontSize: '0.75rem', lineHeight: '1rem' }}>
          {JSON.stringify(scores[0], null, 2)}
        </SyntaxHighlighter>
      </div>
    )
  }

  return (
    <Tabs defaultValue={scores[0].name} className="container -mx-8 px-8">
      <TabsList>
        {scores.map((score) => (
          <TabsTrigger key={score.name} value={score.name} className='cursor-pointer hover:bg-zinc-900'>{score.name}</TabsTrigger>
        ))}
      </TabsList>
      {scores.map((score) => (
        <TabsContent key={score.name} value={score.name}>
          <SyntaxHighlighter
            language={'json'}
            style={oneDark}
            customStyle={{ margin: 0, borderRadius: '0.375rem', fontSize: '0.75rem', lineHeight: '1rem' }}
          >
            {JSON.stringify(score, null, 2)}
          </SyntaxHighlighter>
        </TabsContent>
      ))}
    </Tabs>
  )
}

export default ScoresRenderer;