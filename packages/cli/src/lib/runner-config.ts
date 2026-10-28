import type { CliOptions } from 'vitest/node';
import type { Plugin, ViteUserConfig } from 'vitest/config';
import { createRunnerConfig } from '@viteval/core/internal/runner';

/** Supported evaluation CLI overrides, translated into internal runner options. */
export interface EvaluationRunnerOptions {
  root?: string;
  config?: string;
  watch?: boolean;
  timeout?: number;
  concurrency?: number;
  retries?: number;
  name?: string;
  coverage?: boolean;
}

/** createVitest inputs composing a project with Viteval's internal runner adapter. */
export interface RunnerOverrides {
  test: CliOptions;
  vite: ViteUserConfig;
}

/**
 * Compose a project configuration with Viteval's internal runner adapter.
 *
 * Explicit CLI options become internal Vitest fields (`--timeout` becomes
 * `testTimeout` and also wins over config-file `eval.timeout` through the
 * adapter's own precedence), so no native Vitest options are exposed.
 *
 * @param params - Parsed evaluation args, the resolved project, and optional extra Vite plugins.
 * @returns The first two createVitest arguments: test overrides and the adapter-carrying Vite config.
 * @example const { test, vite } = createRunnerOverrides({ argv, project: resolved });
 */
export function createRunnerOverrides(params: {
  argv: EvaluationRunnerOptions;
  project: { configFile?: string; root: string };
  plugins?: Plugin[];
}): RunnerOverrides {
  const watch = params.argv.watch ?? false;
  return {
    test: {
      config: params.project.configFile ?? false,
      root: params.argv.root !== undefined ? params.project.root : undefined,
      run: !watch,
      watch,
      ...(params.argv.timeout !== undefined && {
        testTimeout: params.argv.timeout,
      }),
      ...(params.argv.concurrency !== undefined && {
        maxConcurrency: params.argv.concurrency,
      }),
      ...(params.argv.retries !== undefined && { retry: params.argv.retries }),
      ...(params.argv.name !== undefined && {
        testNamePattern: params.argv.name,
      }),
      ...(params.argv.coverage && { coverage: { enabled: true } }),
    },
    vite: {
      plugins: [
        createRunnerConfig(params.project).plugins,
        ...(params.plugins ?? []),
      ],
    },
  };
}

/**
 * Extract positional file filters from raw command tokens.
 *
 * Named option values (`--root app`) are skipped so only free tokens remain;
 * tokens after `--` are always treated as filters.
 *
 * @param params - Raw normalized argv (argv[0] is always the CLI name), the command token, and its value-taking flags.
 * @returns Positional file filter tokens, in invocation order.
 * @example
 * extractFileFilters({
 *   argv: ['viteval', 'run', '--name', 'x', 'basic.eval.ts'],
 *   command: 'run',
 *   valueFlags: RUN_VALUE_FLAGS,
 * });
 */
export function extractFileFilters(params: {
  argv: readonly string[];
  command: string;
  valueFlags: ReadonlySet<string>;
}): string[] {
  const commandIndex = params.argv.indexOf(params.command, 1);
  if (commandIndex === -1) {
    return [];
  }
  const tokens = params.argv.slice(commandIndex + 1);
  return tokens.reduce<{
    filters: string[];
    skipNext: boolean;
    positional: boolean;
  }>(
    (state, token) => {
      if (state.positional) {
        return { ...state, filters: [...state.filters, token] };
      }
      if (state.skipNext) {
        return { ...state, skipNext: false };
      }
      if (token === '--') {
        return { ...state, positional: true };
      }
      if (token.startsWith('--')) {
        const [flag, ...value] = token.slice(2).split('=');
        return {
          ...state,
          skipNext: !value.length && params.valueFlags.has(flag!),
        };
      }
      if (token.startsWith('-')) {
        return state;
      }
      return { ...state, filters: [...state.filters, token] };
    },
    { filters: [], skipNext: false, positional: false }
  ).filters;
}

/**
 * Create a Vite plugin that enables dataset-discovery collection inside evaluation modules.
 *
 * The collection scope makes the core evaluate() short-circuit into a registered
 * skip suite, so dynamic collection lists evaluation names without running
 * data generators, tasks, or scorers.
 *
 * @returns The transform plugin for `createRunnerOverrides`.
 * @example createRunnerOverrides({ argv, project, plugins: [createEvaluationDiscoveryPlugin()] });
 */
export function createEvaluationDiscoveryPlugin(): Plugin {
  return {
    name: 'viteval-evaluation-discovery',
    config() {
      return { test: { provide: { vitevalDiscovery: true } } };
    },
  };
}
