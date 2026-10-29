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

test('published pages provide titles, descriptions, and a standard or explicit custom layout', async () => {
  for (const page of pages) {
    const content = await readFile(
      new URL(`../${page}`, import.meta.url),
      'utf8'
    );
    const frontmatter = content.match(/^---\n([\s\S]*?)\n---\n/)?.[1];
    assert.ok(frontmatter, `${page}: missing frontmatter`);
    assert.match(frontmatter, /^title: .+/m, page);
    assert.match(frontmatter, /^description: .+/m, page);

    if (/^pageType: custom$/m.test(frontmatter)) {
      assert.ok(
        ['docs/index.mdx', 'docs/features.mdx', 'docs/brand.mdx'].includes(
          page
        ),
        `${page}: use a standard documentation template`
      );
      continue;
    }

    const prose = content.replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, '');
    assert.equal([...prose.matchAll(/^# .+/gm)].length, 1, page);
  }
});

test('guides share the Ciderpress task template and flat numbered steps', async () => {
  const guides = pages.filter(
    (page) =>
      page.startsWith('docs/guide/') || page === 'docs/getting-started.mdx'
  );
  for (const page of guides) {
    const content = await readFile(
      new URL(`../${page}`, import.meta.url),
      'utf8'
    );
    const headings = [...content.matchAll(/^## (.+)$/gm)].map(
      (match) => match[1]
    );
    const required = [
      'Prerequisites',
      'Steps',
      'Verification',
      'Troubleshooting',
      'References',
    ];
    assert.deepEqual(
      headings.filter((heading) => required.includes(heading)),
      required,
      page
    );
    const steps = [...content.matchAll(/<Steps>([\s\S]*?)<\/Steps>/g)];
    assert.equal(steps.length, 1, page);
    assert.match(steps[0][1], /<Step title="[^\d][^"]+">/, page);
    assert.doesNotMatch(steps[0][1], /<Steps>|^### /m, page);
    assert.equal(
      [...steps[0][1].matchAll(/<Step title=/g)].length,
      [...content.matchAll(/<Step title=/g)].length,
      `${page}: keep every step in the same group`
    );
    assert.match(
      content,
      /import \{[^}]*\bSteps\b[^}]*\bStep\b[^}]*\} from '@theme'/,
      page
    );
    assert.match(content, /## Prerequisites\n\n- /, page);
    assert.match(content, /## References\n\n- \[/, page);
  }
});

test('reference and concept pages share their category templates', async () => {
  const references = pages.filter((page) =>
    /^docs\/(api|cli|concepts)\//.test(page)
  );
  const functionPages = [
    'evaluate',
    'define-dataset',
    'sample-items',
    'create-scorer',
    'wrap-scorer',
  ];
  for (const page of references) {
    const content = await readFile(
      new URL(`../${page}`, import.meta.url),
      'utf8'
    );
    assert.match(content, /## References\n\n- \[/, page);
    if (page.startsWith('docs/cli/')) {
      assert.match(
        content,
        /## Usage\n[\s\S]*## Options\n[\s\S]*## Examples\n/,
        page
      );
    }
    if (functionPages.some((name) => page === `docs/api/${name}.mdx`)) {
      assert.match(
        content,
        /## Import\n[\s\S]*## Signature\n[\s\S]*## Parameters\n/,
        page
      );
      assert.match(content, /## Example\n/, page);
      assert.match(content, /## Return value(?: and errors)?\n/, page);
    }
    if (page.startsWith('docs/api/')) {
      assert.match(
        content,
        /import \{ Field, FieldGroup(?:, PackageManagerTabs)? \} from '@theme'/,
        page
      );
      assert.match(content, /<FieldGroup\b/, page);
    }
  }
});

test('restored dataset, migration, and storage docs retain examples and verification', async () => {
  const dataset = await readFile(
    new URL('../docs/api/define-dataset.mdx', import.meta.url),
    'utf8'
  );
  assert.match(dataset, /## `DATASET_FILE_SCHEMA`/);
  assert.match(dataset, /from '@viteval\/core\/dataset'/);
  assert.match(dataset, /DATASET_FILE_SCHEMA\.safeParse/);
  assert.match(dataset, /pnpm add -D @viteval\/core@rc/);
  assert.match(dataset, /Please cancel ord-2087\./);
  assert.match(dataset, /How do I update my address\?/);
  for (const name of ['migration', 'providers']) {
    const content = await readFile(
      new URL(`../docs/guide/${name}.mdx`, import.meta.url),
      'utf8'
    );
    assert.match(
      content,
      /task: \(\{ input \}\) => input\.toUpperCase\(\)/,
      name
    );
    assert.match(content, /pnpm exec viteval run/, name);
    assert.match(content, /## Verification\n[\s\S]*- \[ \]/, name);
  }
});

test('configuration groups settings before examples and migration supports each package manager', async () => {
  const configuration = await readFile(
    new URL('../docs/api/configuration.mdx', import.meta.url),
    'utf8'
  );
  assert.match(
    configuration,
    /## Project settings\n[\s\S]*## Evaluation defaults\n[\s\S]*## Example\n[\s\S]*## References\n/
  );
  const migration = await readFile(
    new URL('../docs/guide/migration.mdx', import.meta.url),
    'utf8'
  );
  for (const command of ['npx viteval', 'pnpm exec viteval', 'yarn viteval']) {
    for (const argument of [
      'run migration-check.eval.ts',
      'data',
      'run',
      'ui',
    ]) {
      assert.ok(
        migration.includes(`${command} ${argument}`),
        `${command} ${argument}`
      );
    }
  }
});

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
