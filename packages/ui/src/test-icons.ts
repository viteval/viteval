import { addCollection } from '@iconify/react';

// Test-only SVG data keeps the real Iconify renderer offline, including file-type icons.
const iconCollections = {
  catppuccin: [
    'audio',
    'binary',
    'changelog',
    'config',
    'css',
    'csv',
    'docker',
    'env',
    'file',
    'git',
    'go',
    'graphql',
    'html',
    'image',
    'javascript',
    'json',
    'key',
    'license',
    'lock',
    'log',
    'markdown',
    'pdf',
    'prisma',
    'python',
    'readme',
    'rust',
    'text',
    'todo',
    'toml',
    'typescript',
    'video',
    'vite',
    'workflow',
    'xml',
    'yaml',
    'zip',
  ],
  'devicon-plain': ['postgresql', 'sqlite'],
  lucide: [
    'arrow-down',
    'arrow-right',
    'arrow-up',
    'bar-chart-3',
    'book-open',
    'calendar',
    'check',
    'chevron-down',
    'chevron-left',
    'chevron-right',
    'chevron-up',
    'chevrons-left',
    'chevrons-right',
    'chevrons-up-down',
    'circle',
    'circle-check',
    'circle-x',
    'clock',
    'copy',
    'cpu',
    'database',
    'download',
    'flask-conical',
    'github',
    'hard-drive',
    'hash',
    'home',
    'layout-dashboard',
    'more-horizontal',
    'panel-left',
    'pencil',
    'play',
    'plus',
    'rotate-ccw',
    'search',
    'settings',
    'shield-check',
    'tag',
    'target',
    'trending-up',
    'upload',
    'x',
  ],
  'simple-icons': ['braintrust'],
} as const;

export const TEST_ICON_NAMES = Object.entries(iconCollections).flatMap(
  ([prefix, names]) => names.map((name) => `${prefix}:${name}`)
);

for (const [prefix, names] of Object.entries(iconCollections)) {
  const icons = Object.fromEntries(
    names.map((name) => [
      name,
      { body: '<path d="M4 4h16v16H4z" fill="currentColor" />' },
    ])
  );
  if (!addCollection({ prefix, icons, width: 24, height: 24 })) {
    throw new Error(`Failed to register offline test icons: ${prefix}`);
  }
}
