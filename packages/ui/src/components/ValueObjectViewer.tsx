import { get } from "lodash";
import { useMemo, useState } from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function canViewObject(obj: unknown): obj is object {
  return isJSON(obj);
}

export function ValueObjectViewer({ obj }: { obj: unknown }) {
  const paths = getStringFieldPaths(isJSON(obj) && typeof obj === 'string' ? JSON.parse(obj) : obj);
  const [selectedPath, setSelectedPath] = useState<string | undefined>(paths[0]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('markdown');

  const content = useMemo(() => {
    if (!selectedPath) return undefined;
    if (typeof obj === 'string') {
      return get(JSON.parse(obj), selectedPath);
    }
    return get(obj, selectedPath);
  }, [selectedPath, obj]);

  return (
    <div>
      <div className="flex gap-2">
        <div>
          <div className="text-sm font-medium mb-2">Paths</div>
          <Select value={selectedPath} onValueChange={setSelectedPath}>
            <SelectTrigger className="w-[180px] cursor-pointer">
              <SelectValue placeholder="Select a path" />
            </SelectTrigger>
            <SelectContent>
              {paths.map((path) => <SelectItem key={path} value={path} className="cursor-pointer">{path}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {selectedPath && content && (
          <div>
            <div className="text-sm font-medium mb-2">Language</div>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-[180px] cursor-pointer">
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                {['markdown', 'plaintext', 'json', 'typescript', 'javascript', 'jsx', 'tsx', 'css', 'scss', 'sql', 'html', 'xml', 'yaml', 'ruby', 'java', 'python', 'go', 'rust', 'php', 'swift', 'kotlin', 'dart', 'elixir', 'erlang', 'haskell', 'scala', 'groovy', 'clojure', 'lisp', 'erlang', 'haskell', 'scala', 'groovy', 'clojure', 'lisp', 'erlang', 'haskell', 'scala', 'groovy', 'clojure', 'lisp', 'erlang', 'haskell', 'scala', 'groovy', 'clojure', 'lisp'].map((language) => <SelectItem key={language} value={language} className="cursor-pointer">{language}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      {selectedPath && !content && <div>Unable to render the content at the selected path</div>}
      {selectedPath && content && (
        <div className="mt-4">
          <SyntaxHighlighter
            language={selectedLanguage}
            style={oneDark}
            customStyle={{
              margin: 0,
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              lineHeight: '1rem',
            }}
          >
            {content}
          </SyntaxHighlighter>
        </div>
      )}
    </div>
  );
}


type FieldPath = string;

function getStringFieldPaths(
  obj: unknown,
  parentPath = ''
): FieldPath[] {
  const paths: FieldPath[] = [];

  // Handle null or undefined
  if (obj === null || obj === undefined) {
    return paths;
  }

  // If current value is a string, return the path
  if (typeof obj === 'string') {

    return parentPath ? [parentPath] : [];
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const currentPath = parentPath
        ? `${parentPath}.${index}`
        : `${index}`;
      paths.push(...getStringFieldPaths(item, currentPath));
    });
    return paths;
  }

  // Handle objects
  if (typeof obj === 'object') {
    Object.entries(obj).forEach(([key, value]) => {
      const currentPath = parentPath
        ? `${parentPath}.${key}`
        : key;

      if (typeof value === 'string') {
        paths.push(currentPath);
      } else if (value !== null && value !== undefined) {
        paths.push(...getStringFieldPaths(value, currentPath));
      }
    });
  }

  return paths;
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