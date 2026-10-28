import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const config = await readFile(
  new URL('../ciderpress.config.ts', import.meta.url),
  'utf8'
);
const pages = [...config.matchAll(/include: '(docs\/[^']+)'/g)].map(
  (match) => match[1]
);

test('published docs do not restore removed initialization or reporter APIs', async () => {
  for (const page of pages) {
    const content = await readFile(
      new URL(`../${page}`, import.meta.url),
      'utf8'
    );
    assert.doesNotMatch(
      content,
      /initializeModel|initializeProvider|getDatasetProvider|JsonReporter|viteval\/reporters|test\.setupFiles|vitest\.config/,
      page
    );
  }
});

test('custom docs describe the released configuration and registration contract', async () => {
  const gettingStarted = await readFile(
    new URL('../docs/getting-started.mdx', import.meta.url),
    'utf8'
  );
  const evaluate = await readFile(
    new URL('../docs/api/evaluate.mdx', import.meta.url),
    'utf8'
  );
  const models = await readFile(
    new URL('../docs/guide/models.mdx', import.meta.url),
    'utf8'
  );
  assert.match(gettingStarted, /viteval\.config\.ts/);
  assert.match(evaluate, /\): void;/);
  assert.doesNotMatch(evaluate, /testOptions|describe\(\)/);
  assert.match(models, /providers: \[openai\]/);
  assert.match(models, /language: 'openai:/);
});
