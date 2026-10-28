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
    description: 'Root directory containing viteval.config.ts',
    type: 'string',
  },
  config: {
    alias: 'c',
    description: 'Viteval config file',
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
  pattern: z.string().default(DATA_POSITIONALS.pattern.default),
});

export const UI_ARGS = z.object({
  port: z.number().int().min(1).max(65_535).optional(),
  open: z.boolean().default(false),
  debug: z.boolean().default(false),
  root: z.string().optional(),
});

export const RUN_OPTIONS = {
  root: {
    description: 'Root directory containing viteval.config.ts',
    type: 'string',
  },
  config: {
    description: 'Viteval config file',
    type: 'string',
  },
  watch: {
    default: false,
    description: 'Watch evaluation files and rerun on changes',
    type: 'boolean',
  },
  timeout: {
    description: 'Case timeout in milliseconds (0 disables)',
    type: 'number',
  },
  concurrency: {
    description: 'Maximum concurrently executing evaluation cases',
    type: 'number',
  },
  retries: {
    description: 'Number of retries for failed cases',
    type: 'number',
  },
  name: {
    description: 'Only run cases whose names match this pattern',
    type: 'string',
  },
  coverage: {
    default: false,
    description: 'Collect test coverage',
    type: 'boolean',
  },
} as const;

export const RUN_POSITIONALS = {
  'filters..': {
    description: 'Evaluation file path filters',
    type: 'string',
  },
} as const;

/** Run options that consume the token after the flag; file filters never do. */
export const RUN_VALUE_FLAGS = new Set([
  'cwd',
  'root',
  'config',
  'timeout',
  'concurrency',
  'retries',
  'name',
]);

export const RUN_ARGS = z.object({
  root: z.string().optional(),
  config: z.string().optional(),
  watch: z.boolean().default(false),
  timeout: z.number().int().min(0).optional(),
  concurrency: z.number().int().min(1).optional(),
  retries: z.number().int().min(0).optional(),
  name: z.string().optional(),
  coverage: z.boolean().default(false),
});

export const LIST_OPTIONS = {
  root: {
    description: 'Root directory containing viteval.config.ts',
    type: 'string',
  },
  config: {
    description: 'Viteval config file',
    type: 'string',
  },
  json: {
    default: false,
    description: 'Print evaluations as JSON',
    type: 'boolean',
  },
} as const;

export const LIST_POSITIONALS = {
  'filters..': {
    description: 'Evaluation file path filters',
    type: 'string',
  },
} as const;

/** List options that consume the token after the flag; file filters never do. */
export const LIST_VALUE_FLAGS = new Set(['root', 'config', 'cwd']);

export const LIST_ARGS = z.object({
  root: z.string().optional(),
  config: z.string().optional(),
  json: z.boolean().default(false),
});

export const INIT_ARGS = z.object({
  'env-file': z.boolean().optional(),
  'env-file-path': z.string().default('.env'),
});
