import { spawn } from 'node:child_process';
import path from 'node:path';

const pnpmPath = process.env.npm_execpath;
if (!pnpmPath) {
  throw new Error(
    'Run binary checks with pnpm --filter @viteval/cli test:binary'
  );
}

const isScript = /\.[cm]?js$/.test(pnpmPath);
const child = spawn(
  isScript ? process.execPath : pnpmPath,
  [...(isScript ? [pnpmPath] : []), '--filter', 'viteval', 'test'],
  {
    cwd: path.resolve(import.meta.dirname, '../..'),
    env: {
      ...process.env,
      VITEVAL_TEST_BINARY: path.join(
        import.meta.dirname,
        'dist',
        'bin',
        process.platform === 'win32' ? 'viteval.exe' : 'viteval'
      ),
    },
    stdio: 'inherit',
  }
);

child.once('error', (error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
child.once('exit', (code) => {
  process.exitCode = code ?? 1;
});
