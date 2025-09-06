import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface ValueRendererProps {
  value: unknown
  className?: string
}

function isJSON(value: unknown): boolean {
  if (typeof value !== 'string') return true // Non-strings will be JSON.stringified

  // Check if it looks like JSON
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    trimmed === 'null' ||
    trimmed === 'true' ||
    trimmed === 'false' ||
    !Number.isNaN(Number(trimmed))
  ) {
    try {
      JSON.parse(trimmed)
      return true
    } catch {
      return false
    }
  }
  return false
}

function formatValue(value: unknown): { content: string; isJson: boolean } {
  if (value === null || value === undefined) {
    return { content: 'null', isJson: true }
  }

  if (typeof value === 'string') {
    if (isJSON(value)) {
      try {
        const parsed = JSON.parse(value)
        return { content: JSON.stringify(parsed, null, 2), isJson: true }
      } catch {
        return { content: value, isJson: false }
      }
    }
    return { content: value, isJson: false }
  }

  if (typeof value === 'object') {
    return { content: JSON.stringify(value, null, 2), isJson: true }
  }

  return { content: String(value), isJson: false }
}

export function ValueRenderer({ value, className = '' }: ValueRendererProps) {
  const { content, isJson } = formatValue(value)

  if (isJson) {
    return (
      <SyntaxHighlighter
        language="json"
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: '0.375rem',
          fontSize: '0.75rem',
          lineHeight: '1rem',
        }}
        className={className}
      >
        {content}
      </SyntaxHighlighter>
    )
  }

  // Render as markdown for non-JSON content
  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        components={{
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''

            if (language) {
              return (
                <SyntaxHighlighter
                  language={language}
                  style={oneDark}
                  customStyle={{
                    margin: 0,
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    lineHeight: '1rem',
                  }}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              )
            }

            return (
              <code className="bg-muted px-1 py-0.5 rounded text-xs" {...props}>
                {children}
              </code>
            )
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}