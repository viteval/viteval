import { isJSON } from '@/lib/utils';

export type ValueKind = 'object' | 'text' | 'markdown' | 'code' | 'primitive';

const MARKDOWN_HEADING = /^#{1,6}\s/m;
const MARKDOWN_UNORDERED_LIST = /^\s*[-*+]\s/m;
const MARKDOWN_ORDERED_LIST = /^\s*\d+\.\s/m;
const MARKDOWN_BOLD = /\*\*.+\*\*/;
const MARKDOWN_LINK = /\[.+\]\(.+\)/;
const MARKDOWN_BLOCKQUOTE = /^>\s/m;
const MARKDOWN_TABLE = /\|.+\|/;

const FENCED_CODE_BLOCK = /```/;

function hasMarkdownSyntax(value: string): boolean {
  return (
    MARKDOWN_HEADING.test(value) ||
    MARKDOWN_UNORDERED_LIST.test(value) ||
    MARKDOWN_ORDERED_LIST.test(value) ||
    MARKDOWN_BOLD.test(value) ||
    MARKDOWN_LINK.test(value) ||
    MARKDOWN_BLOCKQUOTE.test(value) ||
    MARKDOWN_TABLE.test(value)
  );
}

/**
 * Detect the content type of a value for rendering purposes.
 */
export function detectValueKind(value: unknown): ValueKind {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return 'primitive';
  }

  if (typeof value === 'object') {
    return 'object';
  }

  if (typeof value === 'string') {
    if (isJSON(value)) {
      return 'object';
    }

    if (FENCED_CODE_BLOCK.test(value)) {
      return 'code';
    }

    if (hasMarkdownSyntax(value)) {
      return 'markdown';
    }

    return 'text';
  }

  return 'text';
}

/**
 * Badge label for each value kind.
 */
export function getKindLabel(kind: ValueKind): string {
  switch (kind) {
    case 'object': {
      return '{ }';
    }
    case 'text': {
      return 'Aa';
    }
    case 'markdown': {
      return '¶';
    }
    case 'code': {
      return '</>';
    }
    case 'primitive': {
      return '#';
    }
  }
}

/**
 * Badge variant for each value kind.
 */
export function getKindVariant(
  kind: ValueKind
): 'default' | 'secondary' | 'outline' {
  switch (kind) {
    case 'object': {
      return 'default';
    }
    case 'code': {
      return 'secondary';
    }
    default: {
      return 'outline';
    }
  }
}
