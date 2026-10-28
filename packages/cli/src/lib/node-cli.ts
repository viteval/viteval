import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import { constants } from 'node:os';
import path from 'node:path';
import { parseInvocation } from '#/lib/argv';

/**
 * Run the installed Viteval Node CLI from the compiled command shell.
 * @param args - Original Viteval command tokens.
 * @returns Resolves after the child exits, preserving its exit status.
 * @example
 * await runNodeCli(['run', '--root', './project']);
 */
export async function runNodeCli(args: readonly string[]): Promise<void> {
  const forwardedArgs = parseInvocation(args).args;
  const rootIndex = args.findIndex((arg) => arg === '--root' || arg === '-r');
  const rootOption = args.find((arg) => arg.startsWith('--root='));
  const root =
    rootOption?.slice('--root='.length) ??
    (rootIndex >= 0 ? args[rootIndex + 1] : undefined);
  const entry = await resolveNodeCli([
    path.resolve(root ?? '.'),
    process.cwd(),
  ]);
  const child = spawn('node', [entry, ...forwardedArgs], { stdio: 'inherit' });
  const interrupt = () => child.kill('SIGINT');
  const terminate = () => child.kill('SIGTERM');

  process.on('SIGINT', interrupt);
  process.on('SIGTERM', terminate);
  try {
    await new Promise<void>((resolve, reject) => {
      child.once('error', reject);
      child.once('exit', (code, signal) => {
        process.exitCode =
          code ?? (signal ? 128 + constants.signals[signal] : 1);
        resolve();
      });
    });
  } finally {
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', terminate);
  }
}

async function resolveNodeCli(roots: readonly string[]): Promise<string> {
  for (const root of roots) {
    for (const directory of ancestorPaths(root)) {
      for (const packageName of ['viteval', '@viteval/cli']) {
        const entry = path.join(
          directory,
          'node_modules',
          packageName,
          'cli.mjs'
        );
        try {
          await access(entry);
          return entry;
        } catch {
          continue;
        }
      }
    }
  }
  throw new Error(
    'Install viteval in your project before running evaluations, datasets, or the UI with the binary. Node.js >=26 must be available on PATH.'
  );
}

function ancestorPaths(directory: string): string[] {
  const parent = path.dirname(directory);
  if (parent === directory) {
    return [directory];
  }
  return [directory, ...ancestorPaths(parent)];
}
