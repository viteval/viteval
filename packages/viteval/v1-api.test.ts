import { spawnSync } from 'node:child_process';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { EVAL_RESULTS_SCHEMA } from '@viteval/core/reporters';

const ROOT = path.join(import.meta.dirname, '.test-v1-api'),
  CLI = path.resolve(import.meta.dirname, '../cli/cli.mjs');
let sequence = 0;

afterAll(async () => {
  await rm(ROOT, { force: true, recursive: true });
});

describe('V1 public API', () => {
  it('should load config in the worker and write dashboard-readable JSON without setup or reporters', async () => {
    const root = await fixture({
        config: `import { defineConfig, createJsonProvider } from 'viteval';
export default defineConfig({ eval: { threshold: 0.5, results: ['json'] }, providers: [createJsonProvider({ root: import.meta.dirname })] });`,
        evaluation: `import { evaluate, createScorer } from 'viteval';
evaluate('configured defaults', { data: [{ input: 'hello', expected: 'HELLO' }], task: ({ input }) => input.toUpperCase(), scorers: [createScorer({ name: 'partial', score: () => ({ score: 0.75 }) })] });`,
      }),
      result = run(root, ['run']);
    expect(result.status, result.logs).toBe(0);
    const reports = await reportsAt(root);
    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({ numPassedEvals: 1, success: true });
    expect(reports[0].evalResults[0].evalResults[0]).toMatchObject({
      output: 'HELLO',
      threshold: 0.5,
    });
  });

  it('should replace inherited destinations and persist nothing for an empty array', async () => {
    const root = await fixture({
        config: `import { defineConfig } from 'viteval/config'; export default defineConfig({ eval: { results: ['json'] } });`,
        evaluation: `import { evaluate, scorers } from 'viteval';
evaluate('private', { data: [{ input: 'a', expected: 'a' }], task: ({ input }) => input, scorers: [scorers.exactMatch()], results: [] });`,
      }),
      result = run(root, ['run']);
    expect(result.status, result.logs).toBe(0);
    expect(await reportsAt(root)).toEqual([]);
  });

  it('should generate once, save to multiple providers, and read an explicit source', async () => {
    const root = await fixture({
        config: `import { defineConfig, createJsonProvider, createProvider } from 'viteval';
const mirror = createJsonProvider({ root: import.meta.dirname + '/mirror' });
export default defineConfig({ providers: [createJsonProvider({ root: import.meta.dirname }), createProvider({ ...mirror, name: 'mirror' })], dataset: { providers: ['json', 'mirror'] } });`,
        dataset: `import { appendFile } from 'node:fs/promises'; import { defineDataset } from 'viteval';
export default defineDataset({ name: 'support', data: async () => { await appendFile(import.meta.dirname + '/generations', '1'); return [{ input: 'answer', expected: 'answer', reviewed: true }]; } });`,
        evaluation: `import { evaluate, scorers } from 'viteval';
evaluate('saved cases', { data: ({ json }) => json.dataset('support'), task: ({ input }) => input, scorers: [scorers.exactMatch()] });`,
      }),
      generated = run(root, ['data']);
    expect(generated.status, generated.logs).toBe(0);
    expect(await readFile(path.join(root, 'generations'), 'utf8')).toBe('1');
    for (const directory of [root, path.join(root, 'mirror')]) {
      const saved = JSON.parse(
        await readFile(
          path.join(directory, '.viteval/datasets/support.json'),
          'utf8'
        )
      );
      expect(saved.data).toEqual([
        { expected: 'answer', input: 'answer', reviewed: true },
      ]);
    }
    const result = run(root, ['run']);
    expect(result.status, result.logs).toBe(0);
    expect((await reportsAt(root))[0].numPassedEvals).toBe(1);
  });

  it('should finish healthy result destinations and close providers after a partial upload failure', async () => {
    const root = await fixture({
        config: `import { appendFile } from 'node:fs/promises';
import { defineConfig, createProvider, createJsonProvider } from 'viteval';
const json = createJsonProvider({ root: import.meta.dirname });
const marker = (value) => appendFile(import.meta.dirname + '/events', value + '\\n');
const broken = createProvider({ name: 'broken', evals: { ...json.evals, addResult: async () => ({ ok: false, error: new Error('upload rejected') }) }, initialize: async () => { await marker('initialize'); return { ok: true, value: undefined }; }, close: async () => { await marker('close'); return { ok: true, value: undefined }; } });
export default defineConfig({ providers: [json, broken], eval: { results: ['broken', 'json'] } });`,
        evaluation: `import { appendFile } from 'node:fs/promises'; import { evaluate, scorers } from 'viteval';
evaluate('partial fan-out', { data: [{ input: 'a', expected: 'a' }], task: async ({ input }) => { await appendFile(import.meta.dirname + '/events', 'task\\n'); return input; }, scorers: [scorers.exactMatch()] });`,
      }),
      result = run(root, ['run']);
    expect(result.status, result.logs).toBe(1);
    expect(result.logs).toContain('upload rejected');
    expect(await readFile(path.join(root, 'events'), 'utf8')).toBe(
      'initialize\ntask\nclose\n'
    );
    expect(
      (await reportsAt(root)).some((report) => report.numPassedEvals === 1)
    ).toBe(true);
  });

  it('should enforce a lower per-evaluation concurrency limit', async () => {
    const root = await fixture({
        config: `import { defineConfig } from 'viteval'; export default defineConfig({ eval: { concurrency: 5 } });`,
        evaluation: `import { writeFile } from 'node:fs/promises'; import { evaluate, scorers } from 'viteval';
let active = 0; let peak = 0; let completed = 0;
evaluate('limited', { concurrency: 2, data: Array.from({ length: 6 }, (_, input) => ({ input, expected: input })), task: async ({ input }) => { active++; peak = Math.max(peak, active); await new Promise(resolve => setTimeout(resolve, 20)); active--; if (++completed === 6) await writeFile(import.meta.dirname + '/peak', String(peak)); return input; }, scorers: [scorers.exactMatch()] });`,
      }),
      result = run(root, ['run']);
    expect(result.status, result.logs).toBe(0);
    expect(await readFile(path.join(root, 'peak'), 'utf8')).toBe('2');
  });

  it('should reject an ambiguous dataset definition without generating cases', async () => {
    const root = await fixture({
      config: `import { defineConfig, createJsonProvider, createProvider } from 'viteval';
const mirror = createJsonProvider({ root: import.meta.dirname + '/mirror' });
export default defineConfig({ providers: [createJsonProvider({ root: import.meta.dirname }), createProvider({ ...mirror, name: 'mirror' })], dataset: { providers: ['json', 'mirror'] } });`,
      evaluation: `import { evaluate, defineDataset, scorers } from 'viteval';
const dataset = defineDataset({ name: 'ambiguous', data: async () => { throw new Error('generator must not run'); } });
evaluate('ambiguous', { data: dataset, task: () => { throw new Error('task must not run'); }, scorers: [scorers.exactMatch()] });`,
    });
    const result = run(root, ['run']);
    expect(result.status, result.logs).toBe(1);
    expect(result.logs).toContain('multiple destinations');
    expect(result.logs).not.toContain('generator must not run');
  });

  it('should resolve raw SDK provider models and custom scorer context without wrapper imports', async () => {
    const sdk = path.resolve(
        import.meta.dirname,
        '../../examples/vercel-ai/node_modules/@ai-sdk/openai/dist/index.js'
      ),
      root = await fixture({
        config: `import { defineConfig } from 'viteval/config'; import { openai } from ${JSON.stringify(sdk)};
export default defineConfig({ models: { providers: [openai], defaults: { language: 'openai:gpt-4.1-mini' } } });`,
        evaluation: `import { evaluate, createScorer } from 'viteval';
const providerIdentity = createScorer(({ models }) => ({ name: 'identity', score: () => ({ score: models.languageModel('openai:gpt-4.1-mini').provider === 'openai.responses' ? 1 : 0 }) }));
evaluate('model registry', { data: [{ input: 'a', expected: 'a' }], task: ({ input }) => input, scorers: [providerIdentity] });`,
      }),
      result = run(root, ['run']);
    expect(result.status, result.logs).toBe(0);
    expect((await reportsAt(root))[0].numPassedEvals).toBe(1);
  });
});

async function fixture(options: {
  config: string;
  evaluation: string;
  dataset?: string;
}) {
  const root = path.join(ROOT, String(sequence++));
  await mkdir(root, { recursive: true });
  await writeFile(path.join(root, 'viteval.config.ts'), options.config);
  await writeFile(path.join(root, 'support.eval.ts'), options.evaluation);
  if (options.dataset) {
    await writeFile(path.join(root, 'support.dataset.ts'), options.dataset);
  }
  return root;
}

function run(root: string, command: string[]) {
  const result = spawnSync(
    process.execPath,
    [CLI, ...command, '--root', root],
    {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, CI: 'true', NO_COLOR: '1' },
      timeout: 30_000,
    }
  );
  return { ...result, logs: `${result.stdout}${result.stderr}` };
}

async function reportsAt(root: string) {
  const directory = path.join(root, '.viteval/results'),
    files = await readdir(directory).catch((error: unknown) => {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return [];
      }
      throw error;
    });
  return Promise.all(
    files
      .filter((file) => file.endsWith('.json'))
      .map(async (file) =>
        EVAL_RESULTS_SCHEMA.parse(
          JSON.parse(await readFile(path.join(directory, file), 'utf8'))
        )
      )
  );
}
