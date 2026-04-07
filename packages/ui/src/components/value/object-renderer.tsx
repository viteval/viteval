'use client';

import { get } from 'lodash-es';
import { useMemo, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  SYNTAX_HIGHLIGHTER_CODE_STYLE,
  SYNTAX_HIGHLIGHTER_LINE_NUMBER_STYLE,
  SYNTAX_HIGHLIGHTER_STYLE,
  isJSON,
} from '@/lib/utils';
import { CopyButton } from './copy-button';
import { detectValueKind } from './detect';
import { CodeRenderer } from './code-renderer';
import { MarkdownRenderer } from './markdown-renderer';
import { PrimitiveRenderer } from './primitive-renderer';
import { TextRenderer } from './text-renderer';

interface ObjectRendererProps {
  value: unknown;
  label?: string;
}

function resolveObject(value: unknown): object {
  if (typeof value === 'string' && isJSON(value)) {
    return JSON.parse(value) as object;
  }
  return value as object;
}

function getStringFieldPaths(obj: unknown, parentPath = ''): string[] {
  const paths: string[] = [];

  if (obj === null || obj === undefined) {
    return paths;
  }

  if (typeof obj === 'string') {
    return parentPath ? [parentPath] : [];
  }

  if (Array.isArray(obj)) {
    for (const [index, item] of obj.entries()) {
      const currentPath = parentPath ? `${parentPath}.${index}` : `${index}`;
      paths.push(...getStringFieldPaths(item, currentPath));
    }
    return paths;
  }

  if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = parentPath ? `${parentPath}.${key}` : key;
      if (typeof value === 'string') {
        paths.push(currentPath);
      } else if (value !== null && value !== undefined) {
        paths.push(...getStringFieldPaths(value, currentPath));
      }
    }
  }

  return paths;
}

function FieldViewer({ value }: { value: unknown }) {
  const resolved = resolveObject(value);
  const paths = useMemo(() => getStringFieldPaths(resolved), [resolved]);
  const [selectedPath, setSelectedPath] = useState<string | undefined>(
    paths[0]
  );

  const fieldValue = useMemo(() => {
    if (!selectedPath) {
      return undefined;
    }
    return get(resolved, selectedPath) as unknown;
  }, [selectedPath, resolved]);

  const fieldKind = useMemo(
    () => (fieldValue !== undefined ? detectValueKind(fieldValue) : undefined),
    [fieldValue]
  );

  if (paths.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No string fields to display.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1.5">
            Field
          </div>
          <Select value={selectedPath} onValueChange={setSelectedPath}>
            <SelectTrigger className="w-[200px] cursor-pointer text-xs">
              <SelectValue placeholder="Select a field" />
            </SelectTrigger>
            <SelectContent>
              {paths.map((path) => (
                <SelectItem
                  key={path}
                  value={path}
                  className="cursor-pointer text-xs"
                >
                  {path}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {fieldKind && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1.5">
              Type
            </div>
            <div className="h-9 flex items-center">
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {fieldKind}
              </code>
            </div>
          </div>
        )}
      </div>
      {selectedPath && fieldValue !== undefined && (
        <div className="mt-2">
          <FieldValueRenderer value={fieldValue} kind={fieldKind!} />
        </div>
      )}
      {selectedPath && fieldValue === undefined && (
        <p className="text-sm text-muted-foreground">
          Unable to read value at this path.
        </p>
      )}
    </div>
  );
}

/**
 * Render a field value using the appropriate renderer for its kind.
 * This avoids a circular import with the top-level ValueRenderer.
 */
function FieldValueRenderer({
  value,
  kind,
}: {
  value: unknown;
  kind: ReturnType<typeof detectValueKind>;
}) {
  const str = String(value);
  switch (kind) {
    case 'text': {
      return <TextRenderer value={str} />;
    }
    case 'markdown': {
      return <MarkdownRenderer value={str} />;
    }
    case 'code': {
      return <CodeRenderer value={str} />;
    }
    case 'primitive': {
      return <PrimitiveRenderer value={value} />;
    }
    case 'object': {
      // Nested objects just show as JSON
      return (
        <SyntaxHighlighter
          language="json"
          style={oneDark}
          customStyle={SYNTAX_HIGHLIGHTER_STYLE}
          codeTagProps={SYNTAX_HIGHLIGHTER_CODE_STYLE}
          showLineNumbers
          lineNumberStyle={SYNTAX_HIGHLIGHTER_LINE_NUMBER_STYLE}
        >
          {JSON.stringify(value, null, 2)}
        </SyntaxHighlighter>
      );
    }
  }
}

export function ObjectRenderer({ value, label }: ObjectRendererProps) {
  const json = useMemo(() => {
    const resolved = resolveObject(value);
    return JSON.stringify(resolved, null, 2);
  }, [value]);

  return (
    <div className="relative group">
      <Tabs defaultValue="json">
        <TabsList>
          <TabsTrigger value="json" className="cursor-pointer">
            JSON
          </TabsTrigger>
          <TabsTrigger value="fields" className="cursor-pointer">
            Fields
          </TabsTrigger>
        </TabsList>
        <TabsContent value="json">
          <SyntaxHighlighter
            language="json"
            style={oneDark}
            customStyle={SYNTAX_HIGHLIGHTER_STYLE}
            codeTagProps={SYNTAX_HIGHLIGHTER_CODE_STYLE}
            showLineNumbers
            lineNumberStyle={SYNTAX_HIGHLIGHTER_LINE_NUMBER_STYLE}
          >
            {json}
          </SyntaxHighlighter>
          <CopyButton content={json} label={label} />
        </TabsContent>
        <TabsContent value="fields">
          <FieldViewer value={value} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
