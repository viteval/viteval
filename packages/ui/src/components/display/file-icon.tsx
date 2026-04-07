'use client';

import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

type FileType =
  | 'typescript'
  | 'javascript'
  | 'json'
  | 'yaml'
  | 'toml'
  | 'css'
  | 'html'
  | 'markdown'
  | 'python'
  | 'rust'
  | 'go'
  | 'graphql'
  | 'csv'
  | 'xml'
  | 'env'
  | 'docker'
  | 'git'
  | 'prisma'
  | 'text'
  | 'config'
  | 'image'
  | 'audio'
  | 'video'
  | 'pdf'
  | 'zip'
  | 'binary'
  | 'lock'
  | 'log'
  | 'readme'
  | 'license'
  | 'changelog'
  | 'file';

const EXT_MAP: Record<string, FileType> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.mts': 'typescript',
  '.cts': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.json': 'json',
  '.jsonc': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  '.css': 'css',
  '.scss': 'css',
  '.less': 'css',
  '.html': 'html',
  '.htm': 'html',
  '.md': 'markdown',
  '.mdx': 'markdown',
  '.py': 'python',
  '.rs': 'rust',
  '.go': 'go',
  '.graphql': 'graphql',
  '.gql': 'graphql',
  '.csv': 'csv',
  '.xml': 'xml',
  '.svg': 'xml',
  '.env': 'env',
  '.prisma': 'prisma',
  '.txt': 'text',
  '.png': 'image',
  '.jpg': 'image',
  '.jpeg': 'image',
  '.gif': 'image',
  '.webp': 'image',
  '.ico': 'image',
  '.mp3': 'audio',
  '.wav': 'audio',
  '.mp4': 'video',
  '.webm': 'video',
  '.pdf': 'pdf',
  '.zip': 'zip',
  '.tar': 'zip',
  '.gz': 'zip',
  '.lock': 'lock',
  '.log': 'log',
};

const NAME_MAP: Record<string, FileType> = {
  dockerfile: 'docker',
  'docker-compose': 'docker',
  '.gitignore': 'git',
  '.gitattributes': 'git',
  'readme': 'readme',
  'license': 'license',
  'changelog': 'changelog',
};

/**
 * Detect file type from a path or filename.
 */
export function detectFileType(path: string): FileType {
  const filename = path.split('/').pop()?.toLowerCase() ?? '';
  const baseName = filename.replace(/\.[^.]+$/, '');

  // Check full filename / known names first
  for (const [name, type] of Object.entries(NAME_MAP)) {
    if (filename === name || baseName === name) {
      return type;
    }
  }

  // Check config files
  if (
    filename.includes('.config.') ||
    filename.includes('rc.') ||
    filename.startsWith('.')
  ) {
    const ext = `.${filename.split('.').pop()}`;
    if (EXT_MAP[ext]) {
      return EXT_MAP[ext];
    }
    return 'config';
  }

  // Check extension
  const ext = filename.includes('.')
    ? `.${filename.split('.').pop()}`
    : '';
  if (ext && EXT_MAP[ext]) {
    return EXT_MAP[ext];
  }

  return 'file';
}

interface FileIconProps {
  path: string;
  className?: string;
}

/**
 * Render a catppuccin file icon based on the file extension/name.
 */
export function FileTypeIcon({ path, className }: FileIconProps) {
  const type = detectFileType(path);

  return (
    <Icon
      icon={`catppuccin:${type}`}
      className={cn('h-4 w-4 shrink-0', className)}
    />
  );
}
