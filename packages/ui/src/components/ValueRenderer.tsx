import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { toast } from 'sonner'
import { Button } from './ui/button'

interface ValueRendererProps {
  value: unknown
  className?: string
  label?: string
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

function formatValue(value: unknown): { content: string; isJson: boolean; rawContent: string } {
  if (value === null || value === undefined) {
    return { content: 'null', isJson: true, rawContent: 'null' }
  }

  if (typeof value === 'string') {
    if (isJSON(value)) {
      try {
        const parsed = JSON.parse(value)
        const formatted = JSON.stringify(parsed, null, 2)
        return { content: formatted, isJson: true, rawContent: formatted }
      } catch {
        return { content: value, isJson: false, rawContent: value }
      }
    }
    return { content: value, isJson: false, rawContent: value }
  }

  if (typeof value === 'object') {
    const formatted = JSON.stringify(value, null, 2)
    return { content: formatted, isJson: true, rawContent: formatted }
  }

  const stringValue = String(value)
  return { content: stringValue, isJson: false, rawContent: stringValue }
}

export function ValueRenderer({ value, className = '', label = 'Value' }: ValueRendererProps) {
  const { content, isJson, rawContent } = formatValue(value)
  const [copied, setCopied] = useState(false)
  const [showCopyButton, setShowCopyButton] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawContent)
      setCopied(true)
      toast.success(`${label} copied to clipboard`)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      toast.error('Failed to copy to clipboard')
    }
  }

  const wrapperClass = "relative group"

  if (isJson) {
    return (
      <div 
        className={wrapperClass}
        onMouseEnter={() => setShowCopyButton(true)}
        onMouseLeave={() => setShowCopyButton(false)}
      >
        <SyntaxHighlighter
          language="json"
          style={oneDark}
          customStyle={{
            margin: 0,
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            lineHeight: '1rem',
            paddingRight: showCopyButton ? '3rem' : undefined,
          }}
          className={className}
        >
          {content}
        </SyntaxHighlighter>
        {showCopyButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="absolute top-2 right-2 h-6 w-6 p-0 bg-zinc-800 hover:bg-zinc-700 transition-opacity opacity-0 group-hover:opacity-100"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3 text-zinc-300" />
            )}
          </Button>
        )}
      </div>
    )
  }

  // Check if content has markdown code blocks
  const hasCodeBlocks = content.includes('```')
  
  // For simple strings/primitives without markdown, render in a styled container
  if (!hasCodeBlocks && !content.includes('`') && !content.includes('#') && !content.includes('*')) {
    return (
      <div 
        className={wrapperClass}
        onMouseEnter={() => setShowCopyButton(true)}
        onMouseLeave={() => setShowCopyButton(false)}
      >
        <div className={`bg-zinc-900 dark:bg-zinc-900 text-zinc-100 p-3 rounded-md font-mono text-xs leading-relaxed relative ${className}`}>
          <pre className="whitespace-pre-wrap break-words m-0" style={{ paddingRight: showCopyButton ? '2rem' : undefined }}>
            {content}
          </pre>
          {showCopyButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="absolute top-2 right-2 h-6 w-6 p-0 bg-zinc-800 hover:bg-zinc-700 transition-opacity opacity-0 group-hover:opacity-100"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3 text-zinc-300" />
              )}
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Render as markdown for content with markdown formatting
  return (
    <div 
      className={`${wrapperClass} prose prose-sm dark:prose-invert max-w-none ${className}`}
      onMouseEnter={() => setShowCopyButton(true)}
      onMouseLeave={() => setShowCopyButton(false)}
    >
      <div className="relative">
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
                      paddingRight: showCopyButton ? '3rem' : undefined,
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
            p: ({ children }) => (
              <div className="bg-zinc-900 dark:bg-zinc-900 text-zinc-100 p-3 rounded-md font-mono text-xs leading-relaxed whitespace-pre-wrap break-words" style={{ paddingRight: showCopyButton ? '3rem' : undefined }}>
                {children}
              </div>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
        {showCopyButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="absolute top-2 right-2 h-6 w-6 p-0 bg-zinc-800 hover:bg-zinc-700 transition-opacity opacity-0 group-hover:opacity-100 z-10"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3 text-zinc-300" />
            )}
          </Button>
        )}
      </div>
    </div>
  )
}