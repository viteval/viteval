import { spawnSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { createCoverageArguments } from './coverage-fixture';

const ROOT = path.join(import.meta.dirname, '.test-runtime-regressions'),
  CLI = path.resolve(import.meta.dirname, '../cli/cli.mjs');
let sequence = 0;

afterAll(async () => {
  await rm(ROOT, { force: true, recursive: true });
});

describe('worker runtime cleanup regressions', () => {
  it('should preserve a dotted raw SDK provider name without a wrapper', async () => {
    const sdk = path.resolve(
        import.meta.dirname,
        '../../examples/vercel-ai/node_modules/@ai-sdk/openai/dist/index.js'
      ),
      root = await fixture({
        config: `import { defineConfig } from 'viteval/config';
import { createOpenAI } from ${JSON.stringify(sdk)};
export default defineConfig({ models: { providers: [createOpenAI({ name: 'company.gateway' })], defaults: { language: 'company.gateway:gpt-4.1-mini' } }, eval: { results: [] } });`,
        evaluation: `import { evaluate, createScorer } from 'viteval';
evaluate('dotted identity', { data: [{ input: 'q', expected: 'q' }], task: ({ input }) => input,
scorers: [createScorer(({ models }) => ({ name: 'identity', score: () => ({ score: models.languageModel('company.gateway:gpt-4.1-mini').provider === 'company.gateway.responses' ? 1 : 0 }) }))] });`,
      }),
      result = run(root);
    expect(result.status, result.logs).toBe(0);
  });

  it.each(['skipped', 'filtered', 'collection-error'] as const)(
    'should close collection-time resources for a %s file',
    async (scenario) => {
      const root = await fixture({
          evaluation: `import { defineDataset } from 'viteval';
import { test } from 'vitest';
await defineDataset({ name: 'support', data: [] }).load();
${scenario === 'collection-error' ? "throw new Error('collection rejected');" : `test${scenario === 'skipped' ? '.skip' : ''}('excluded', () => {});`}`,
        }),
        result = run(
          root,
          scenario === 'filtered' ? ['--testNamePattern', 'no-match'] : []
        );
      expect(result.status, result.logs).toBe(
        scenario === 'collection-error' ? 1 : 0
      );
      expect(await readFile(path.join(root, 'events'), 'utf8')).toBe(
        'initialize\nclose\n'
      );
      if (scenario === 'collection-error')
        expect(result.logs).toContain('collection rejected');
    }
  );

  it.each(['return', 'throw'] as const)(
    'should close partially initialized resources when initialization fails by %s',
    async (mode) => {
      const root = await fixture({
          initialization:
            mode === 'return'
              ? "return { ok: false, error: new Error('initialization rejected') };"
              : "throw new Error('initialization rejected');",
          evaluation: `import { defineDataset } from 'viteval';
const result = await defineDataset({ name: 'support', data: [] }).load();
if (!result.ok) throw result.error;`,
        }),
        result = run(root);
      expect(result.status, result.logs).toBe(1);
      expect(result.logs).toContain('initialization rejected');
      expect(await readFile(path.join(root, 'events'), 'utf8')).toBe(
        'initialize\nclose\n'
      );
    }
  );
});

async function fixture(options: {
  config?: string;
  evaluation: string;
  initialization?: string;
}) {
  const root = path.join(ROOT, String(sequence++));
  await rm(root, { recursive: true, force: true });
  await mkdir(root, { recursive: true });
  await writeFile(
    path.join(root, 'viteval.config.ts'),
    options.config ??
      `import { appendFile } from 'node:fs/promises';
import { defineConfig, createJsonProvider, createProvider } from 'viteval';
const json = createJsonProvider({ root: import.meta.dirname });
const marker = (value) => appendFile(import.meta.dirname + '/events', value + '\\n');
export default defineConfig({ providers: [createProvider({ ...json,
  initialize: async () => { await marker('initialize'); ${options.initialization ?? 'return { ok: true, value: undefined };'} },
  close: async () => { await marker('close'); return { ok: true, value: undefined }; }
})], eval: { results: [] } });`
  );
  await writeFile(path.join(root, 'support.eval.ts'), options.evaluation);
  return root;
}

function run(root: string, args: string[] = []) {
  const binary = process.env.VITEVAL_TEST_BINARY;
  const argv = ['run', '--root', root, ...args, ...createCoverageArguments()];
  const result = spawnSync(
    binary ?? process.execPath,
    binary ? argv : [CLI, ...argv],
    {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, CI: 'true', NO_COLOR: '1' },
      timeout: 30_000,
    }
  );
  return { ...result, logs: `${result.stdout}${result.stderr}` };
}
