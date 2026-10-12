import { z } from 'zod';

export const DATA_OPTIONS = {
  overwrite: {
    default: false,
    description: 'Overwrite existing datasets',
    type: 'boolean',
  },
  verbose: {
    alias: 'V',
    default: false,
    description: 'Verbose output',
    type: 'boolean',
  },
  root: {
    description: 'Root directory containing the Vitest config',
    type: 'string',
  },
  config: {
    alias: 'c',
    description: 'Vitest config file',
    type: 'string',
  },
  project: {
    alias: 'p',
    description: 'Vitest project used to import datasets',
    type: 'string',
  },
} as const;

export const DATA_POSITIONALS = {
  pattern: {
    default: '**/*.{dataset,eval}.{js,ts,mts,mjs}',
    description: 'Dataset or evaluation file pattern to match',
    type: 'string',
  },
} as const;

export const UI_OPTIONS = {
  port: {
    alias: 'p',
    description: 'Port to run the UI server on',
    type: 'number',
  },
  open: {
    alias: 'o',
    default: false,
    description: 'Open the UI in the browser',
    type: 'boolean',
  },
  debug: {
    alias: 'd',
    default: false,
    description: 'Enable debug mode',
    type: 'boolean',
  },
  root: {
    alias: 'r',
    description: 'Root directory containing .viteval',
    type: 'string',
  },
} as const;

export const DATA_ARGS = z.object({
  overwrite: z.boolean().default(false),
  verbose: z.boolean().default(false),
  root: z.string().optional(),
  config: z.string().optional(),
  project: z.string().optional(),
  pattern: z.string().default(DATA_POSITIONALS.pattern.default),
});

export const UI_ARGS = z.object({
  port: z.number().int().min(1).max(65_535).optional(),
  open: z.boolean().default(false),
  debug: z.boolean().default(false),
  root: z.string().optional(),
});

export const INIT_ARGS = z.object({
  'env-file': z.boolean().optional(),
  'env-file-path': z.string().default('.env'),
});
