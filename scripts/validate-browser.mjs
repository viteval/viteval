import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { createJsonProvider } from '../packages/core/dist/provider/index.mjs';
import { createVitevalServer } from '../packages/ui/server.mjs';

const repository = path.resolve(import.meta.dirname, '..');
const root = await mkdtemp(
  path.join(repository, 'packages/viteval/.test-browser-')
);
const cli = path.join(repository, 'packages/cli/cli.mjs');
const executable =
  process.env.ORCA_CLI_COMMAND ??
  (process.env.ORCA_DEV_REPO_ROOT
    ? 'orca-dev'
    : process.platform === 'linux'
      ? 'orca-ide'
      : 'orca');
const worktree = `path:${repository}`;
const server = createVitevalServer({ root });
let page;

try {
  assert.equal(
    orca(['status']).app.running,
    true,
    'Browser validation requires running Orca with this repository added'
  );
  await writeFile(
    path.join(root, 'package.json'),
    JSON.stringify({
      name: 'viteval-browser-smoke',
      private: true,
      type: 'module',
    })
  );
  await mkdir(path.join(root, 'node_modules'));
  await symlink(
    path.join(repository, 'packages/viteval'),
    path.join(root, 'node_modules/viteval'),
    'dir'
  );
  runCli({ args: ['init', '--cwd', root, '--no-env-file'] });
  const port = await server.start();
  const url = `http://localhost:${port}`;
  page = orca([
    'tab',
    'create',
    '--worktree',
    worktree,
    '--url',
    `${url}/results`,
  ]).browserPageId;
  browser(['capture', 'start']);
  browser(['wait', '--text', 'No results.']);
  assert.match(browser(['snapshot']).snapshot, /0 row\(s\)/);
  browser(['goto', '--url', `${url}/datasets`]);
  browser(['wait', '--text', 'No results.']);
  assert.match(browser(['snapshot']).snapshot, /0 row\(s\)/);
  await writeFile(
    path.join(root, 'vitest.config.ts'),
    `import { defineConfig } from 'vitest/config';
import { JsonReporter } from 'viteval/reporters';
export default defineConfig({ test: {
  reporters: [new JsonReporter({ outputFile: '.viteval/results/smoke.json' })],
  projects: ['alpha', 'beta'].map(name => ({ test: { name, include: ['src/**/*.eval.ts'], setupFiles: ['./viteval.setup.ts'] } })),
} });`
  );
  await writeFile(
    path.join(root, 'src/failure.eval.ts'),
    `import { evaluate, createScorer } from 'viteval';
evaluate('failure diagnostics', { data: [{ input: 'broken task', expected: 'answer' }], task: () => { throw new Error('Browser smoke: task failed'); }, scorers: [createScorer({ name: 'exact', score: () => ({ score: 1 }) })] });
evaluate('skipped diagnostics', { data: [{ input: 'skipped task', expected: 'answer' }], task: () => { throw new Error('Must not execute'); }, scorers: [createScorer({ name: 'exact', score: () => ({ score: 1 }) })], testOptions: { skip: true } });`
  );
  runCli({ args: ['run', '--root', root], expectedStatus: 1 });
  const provider = createJsonProvider({ root });
  const dataset = await provider.datasets.create({
    name: 'questions/first,release',
    items: [
      {
        input: 'question',
        expected: 'answer',
        extra: { context: ['reference'] },
      },
    ],
  });
  if (!dataset.ok) throw dataset.error;
  await writeFile(path.join(root, '.viteval/results/broken.json'), '{broken');
  browser(['goto', '--url', `${url}/results`]);
  browser(['wait', '--text', 'Invalid result file: broken.json']);
  let snapshot = browser(['snapshot']);
  assert.match(snapshot.snapshot, /Failed/);
  click({ snapshot, role: ['button', 'link'], name: /Failed.*4 2 8/ });
  browser(['wait', '--text', 'Browser smoke: task failed']);
  snapshot = browser(['snapshot']);
  assert.match(snapshot.snapshot, /Uppercase \[alpha\]/);
  assert.match(snapshot.snapshot, /Uppercase \[beta\]/);
  assert.match(snapshot.snapshot, /Skipped/);
  click({ snapshot, role: 'button', name: /^broken task / });
  browser(['wait', '--text', 'Input:']);
  snapshot = browser(['snapshot']);
  assert.match(snapshot.snapshot, /Expected:/);
  assert.ok(
    (snapshot.snapshot.match(/Browser smoke: task failed/g) ?? []).length >= 2,
    'Expanded case must expose its execution error'
  );
  click({ snapshot, role: 'button', name: /^hello / });
  snapshot = browser(['snapshot']);
  assert.match(snapshot.snapshot, /HELLO/);

  browser(['goto', '--url', `${url}/datasets`]);
  browser(['wait', '--text', dataset.value.name]);
  snapshot = browser(['snapshot']);
  click({
    snapshot,
    role: ['button', 'link'],
    name: /^questions\/first,release /,
  });
  browser(['wait', '--text', 'Items']);
  snapshot = browser(['snapshot']);
  assert.match(snapshot.origin, /questions%2Ffirst%2Crelease/);
  browser(['reload']);
  browser(['wait', '--text', 'Items']);
  snapshot = browser(['snapshot']);
  assert.match(snapshot.origin, /questions%2Ffirst%2Crelease/);
  click({ snapshot, role: 'button', name: /^questions\/first,release:0 / });
  browser(['wait', '--text', 'Expected:']);
  browser(['wait', '--text', 'reference']);
  snapshot = browser(['snapshot']);
  click({ snapshot, role: 'button', name: /^Tag$/ });
  browser([
    'wait',
    '--selector',
    'input[placeholder="Search or create tag..."]',
  ]);
  snapshot = browser(['snapshot']);
  const input = findRef({
    snapshot,
    role: 'textbox',
    name: /Search or create tag/,
  });
  browser(['fill', '--element', `@${input}`, '--value', 'browser-release']);
  snapshot = browser(['snapshot']);
  click({ snapshot, role: 'button', name: /^Create .*browser-release/ });
  browser(['wait', '--selector', '[aria-label="Remove tag browser-release"]']);
  browser(['keypress', '--key', 'Escape']);
  browser(['reload']);
  browser(['wait', '--selector', '[aria-label="Remove tag browser-release"]']);
  const tagged = await provider.tags.listTaggings({
    entityType: 'dataset',
    entityId: dataset.value.id,
  });
  assert.equal(tagged.ok, true);
  assert.equal(tagged.value[0].name, 'browser-release');
  snapshot = browser(['snapshot']);
  findRef({ snapshot, role: 'button', name: /^Remove tag browser-release$/ });
  // Orca ref activation does not dispatch this icon-only control; activate its DOM click handler.
  browser([
    'eval',
    '--expression',
    `document.querySelector('[aria-label="Remove tag browser-release"]').click()`,
  ]);
  const deadline = Date.now() + 5_000;
  while (true) {
    const current = await provider.tags.listTaggings({
      entityType: 'dataset',
      entityId: dataset.value.id,
    });
    assert.equal(current.ok, true);
    if (current.value.length === 0) break;
    assert.ok(
      Date.now() < deadline,
      'Removing a tag in the browser must persist before reloading'
    );
    await setTimeout(50);
  }
  browser(['reload']);
  browser(['wait', '--text', 'Items']);
  const removed = await provider.tags.listTaggings({
    entityType: 'dataset',
    entityId: dataset.value.id,
  });
  assert.deepEqual(removed.value, []);
  await writeFile(path.join(root, '.viteval/tags.json'), '{broken');
  browser(['reload']);
  browser(['wait', '--text', 'Failed to load tags']);
  assert.match(browser(['snapshot']).snapshot, /Failed to load tags/);
  process.stdout.write(
    'Browser passed: empty projects, project-qualified suites, passing/failing/skipped cases, diagnostics, malformed-file warnings, dataset metadata, encoded IDs, and tagging across reloads.\n'
  );
} catch (error) {
  if (page) {
    try {
      process.stderr.write(
        JSON.stringify(
          {
            refs: browser(['snapshot']).refs,
            console: browser(['console', '--limit', '10']),
            network: browser(['network', '--limit', '10']),
          },
          null,
          2
        ) + '\n'
      );
    } catch (diagnosticsError) {
      process.stderr.write(
        `Browser diagnostics unavailable: ${diagnosticsError.message}\n`
      );
    }
  }
  throw error;
} finally {
  try {
    if (page) {
      const tabs = orca(['tab', 'list', '--worktree', worktree]).tabs;
      const tab = tabs.find((candidate) => candidate.browserPageId === page);
      if (tab)
        orca([
          'tab',
          'close',
          '--worktree',
          worktree,
          '--index',
          String(tab.index),
        ]);
    }
  } finally {
    await server.shutdown();
    await rm(root, { recursive: true, force: true });
  }
}

function orca(args) {
  const response = JSON.parse(
    execFileSync(executable, [...args, '--json'], {
      encoding: 'utf8',
      timeout: 30_000,
    })
  );
  assert.equal(response.ok, true, JSON.stringify(response.error));
  return response.result;
}

function browser(args) {
  return orca([...args, '--page', page]);
}

function findRef({ snapshot, role, name }) {
  const roles = Array.isArray(role) ? role : [role];
  const match = Object.entries(snapshot.refs).find(
    ([, ref]) => roles.includes(ref.role) && name.test(ref.name)
  );
  assert.ok(match, `Missing ${role} ${name}: ${snapshot.snapshot}`);
  return match[0];
}

function click(params) {
  browser(['click', '--element', `@${findRef(params)}`]);
}

function runCli({ args, expectedStatus = 0 }) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    encoding: 'utf8',
    timeout: 30_000,
  });
  assert.equal(
    result.status,
    expectedStatus,
    `${result.stdout}${result.stderr}`
  );
}
