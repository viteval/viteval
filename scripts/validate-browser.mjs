import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { createJsonProvider } from '../packages/core/dist/provider/index.mjs';
import { createVitevalServer } from '../packages/ui/server.mjs';

const repository = path.resolve(import.meta.dirname, '..'),
  root = await mkdtemp(
    path.join(repository, 'packages/viteval/.test-browser-')
  ),
  cli = path.join(repository, 'packages/cli/cli.mjs'),
  executable =
    process.env.ORCA_CLI_COMMAND ??
    (process.env.ORCA_DEV_REPO_ROOT
      ? 'orca-dev'
      : process.platform === 'linux'
        ? 'orca-ide'
        : 'orca'),
  worktree = `path:${repository}`,
  server = createVitevalServer({ root });
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
  const port = await server.start(),
    url = `http://localhost:${port}`;
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
  projects: ['alpha', 'beta'].map(name => ({ test: { name, include: ['src/**/*.eval.ts'] } })),
} });`
  );
  await writeFile(
    path.join(root, 'src/failure.eval.ts'),
    `import { evaluate, createScorer } from 'viteval';
evaluate('failure diagnostics', { data: [{ input: 'broken task', expected: 'answer' }], task: () => { throw new Error('Browser smoke: task failed'); }, scorers: [createScorer({ name: 'exact', score: () => ({ score: 1 }) })] });
evaluate('skipped diagnostics', { data: [{ input: 'skipped task', expected: 'answer' }], task: () => { throw new Error('Must not execute'); }, scorers: [createScorer({ name: 'exact', score: () => ({ score: 1 }) })], skip: true });`
  );
  // Multi-project coverage intentionally uses the native integration, not init's V1 config.
  runCli({
    args: ['run', '--root', root, '--config', 'vitest.config.ts'],
    expectedStatus: 1,
  });
  const provider = createJsonProvider({ root }),
    dataset = await provider.datasets.create({
      items: [
        {
          input: 'question',
          expected: 'answer',
          extra: { context: ['reference'] },
        },
      ],
      name: 'questions/first,release',
    });
  if (!dataset.ok) {
    throw dataset.error;
  }
  await writeFile(path.join(root, '.viteval/results/broken.json'), '{broken');
  browser(['goto', '--url', `${url}/results`]);
  browser(['wait', '--text', 'Invalid result file: broken.json']);
  waitTableInteractive();
  let snapshot = browser(['snapshot']);
  assert.match(snapshot.snapshot, /Failed/);
  click({ name: /Failed.*4 2 8/, role: ['button', 'link'], snapshot });
  browser(['wait', '--text', 'Browser smoke: task failed']);
  snapshot = browser(['snapshot']);
  assert.match(snapshot.snapshot, /Uppercase \[alpha\]/);
  assert.match(snapshot.snapshot, /Uppercase \[beta\]/);
  assert.match(snapshot.snapshot, /Skipped/);
  click({ name: /^broken task /, role: 'button', snapshot });
  browser(['wait', '--text', 'Input:']);
  snapshot = browser(['snapshot']);
  assert.match(snapshot.snapshot, /Expected:/);
  assert.ok(
    (snapshot.snapshot.match(/Browser smoke: task failed/g) ?? []).length >= 2,
    'Expanded case must expose its execution error'
  );
  click({ name: /^hello /, role: 'button', snapshot });
  snapshot = browser(['snapshot']);
  assert.match(snapshot.snapshot, /HELLO/);

  browser(['goto', '--url', `${url}/datasets`]);
  browser(['wait', '--text', dataset.value.name]);
  waitTableInteractive();
  snapshot = browser(['snapshot']);
  click({
    name: /^questions\/first,release /,
    role: ['button', 'link'],
    snapshot,
  });
  waitDatasetDetail(dataset.value.id);
  snapshot = browser(['snapshot']);
  assert.equal(
    new URL(snapshot.origin).pathname,
    `/datasets/${encodeURIComponent(dataset.value.id)}`
  );
  browser(['reload']);
  waitDatasetDetail(dataset.value.id);
  snapshot = browser(['snapshot']);
  assert.equal(
    new URL(snapshot.origin).pathname,
    `/datasets/${encodeURIComponent(dataset.value.id)}`
  );
  browser([
    'focus',
    '--element',
    `@${findRef({ name: /^questions\/first,release:0 /, role: 'button', snapshot })}`,
  ]);
  browser(['keypress', '--key', 'Enter']);
  browser(['wait', '--text', 'Expected:']);
  browser(['wait', '--text', 'reference']);
  snapshot = browser(['snapshot']);
  click({ name: /^Tag$/, role: 'button', snapshot });
  browser([
    'wait',
    '--selector',
    'input[placeholder="Search or create tag..."]',
  ]);
  snapshot = browser(['snapshot']);
  const input = findRef({
    name: /Search or create tag/,
    role: 'textbox',
    snapshot,
  });
  browser(['fill', '--element', `@${input}`, '--value', 'browser-release']);
  snapshot = browser(['snapshot']);
  click({ name: /^Create .*browser-release/, role: 'button', snapshot });
  browser(['wait', '--selector', '[aria-label="Remove tag browser-release"]']);
  browser(['keypress', '--key', 'Escape']);
  browser(['reload']);
  browser(['wait', '--selector', '[aria-label="Remove tag browser-release"]']);
  const tagged = await provider.tags.listTaggings({
    entityId: dataset.value.id,
    entityType: 'dataset',
  });
  assert.equal(tagged.ok, true);
  assert.equal(tagged.value[0].name, 'browser-release');
  snapshot = browser(['snapshot']);
  findRef({ name: /^Remove tag browser-release$/, role: 'button', snapshot });
  // Orca ref activation does not dispatch this icon-only control; activate its DOM click handler.
  browser([
    'eval',
    '--expression',
    `document.querySelector('[aria-label="Remove tag browser-release"]').click()`,
  ]);
  const deadline = Date.now() + 5000;
  while (true) {
    const current = await provider.tags.listTaggings({
      entityId: dataset.value.id,
      entityType: 'dataset',
    });
    assert.equal(current.ok, true);
    if (current.value.length === 0) {
      break;
    }
    assert.ok(
      Date.now() < deadline,
      'Removing a tag in the browser must persist before reloading'
    );
    await setTimeout(50);
  }
  browser(['reload']);
  waitDatasetDetail(dataset.value.id);
  const removed = await provider.tags.listTaggings({
    entityId: dataset.value.id,
    entityType: 'dataset',
  });
  assert.deepEqual(removed.value, []);
  await writeFile(path.join(root, '.viteval/tags.json'), '{broken');
  browser(['reload']);
  browser(['wait', '--text', 'Failed to load tags']);
  assert.match(browser(['snapshot']).snapshot, /Failed to load tags/);
  await verifyRemoteDatasets({ provider, url });
  process.stdout.write(
    'Browser passed: empty projects, project-qualified suites, passing/failing/skipped cases, diagnostics, malformed-file warnings, dataset metadata, encoded IDs, tagging across reloads, and 25-record remote pagination, row sizing, sorting, filtering, and browser back/reload.\n'
  );
} catch (error) {
  if (page) {
    try {
      const snapshot = browser(['snapshot']),
        network = browser(['network', '--limit', '10']);
      process.stderr.write(
        `${JSON.stringify(
          {
            origin: snapshot.origin,
            refs: snapshot.refs,
            console: browser(['console', '--limit', '10']),
            network: network.requests
              ?.slice(-10)
              .map(({ url, method, status }) => ({ url, method, status })),
          },
          null,
          2
        )}\n`
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
      const { tabs } = orca(['tab', 'list', '--worktree', worktree]);
      const tab = tabs.find((candidate) => candidate.browserPageId === page);
      if (tab) {
        orca([
          'tab',
          'close',
          '--worktree',
          worktree,
          '--index',
          String(tab.index),
        ]);
      }
    }
  } finally {
    await server.shutdown();
    await rm(root, { force: true, recursive: true });
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
  const timeout = args[0] === 'wait' ? ['--timeout', '10000'] : [];
  return orca([...args, ...timeout, '--page', page]);
}

function findRef({ snapshot, role, name }) {
  const roles = Array.isArray(role) ? role : [role],
    match = Object.entries(snapshot.refs).find(
      ([, ref]) => roles.includes(ref.role) && name.test(ref.name)
    );
  assert.ok(match, `Missing ${role} ${name}: ${snapshot.snapshot}`);
  return match[0];
}

function click(params) {
  browser(['click', '--element', `@${findRef(params)}`]);
}

function waitDatasetDetail(id) {
  browser(['wait', '--url', `/datasets/${encodeURIComponent(id)}`]);
  browser(['wait', '--text', `${id}:0`]);
  waitTableInteractive();
}

function waitTableInteractive() {
  browser([
    'wait',
    '--fn',
    `document.querySelector('[data-slot="select-value"]')?.textContent.trim().length > 0`,
  ]);
  // Background tabs do not reliably deliver the exit-animation events Radix waits for.
  browser([
    'eval',
    '--expression',
    `(() => {
    if (document.querySelector('style[data-viteval-browser-motion]')) return;
    const style = document.createElement('style');
    style.setAttribute('data-viteval-browser-motion', '');
    style.textContent = '[data-slot="select-content"], [data-slot="dropdown-menu-content"], [data-slot="popover-content"] { animation: none !important; transition: none !important; }';
    document.head.append(style);
  })()`,
  ]);
}

async function verifyRemoteDatasets({ provider, url }) {
  for (let index = 0; index < 25; index++) {
    const created = await provider.datasets.create({
      items: [{ input: `question-${index}`, expected: `answer-${index}` }],
      name: `Browser page ${String(index).padStart(2, '0')}`,
    });
    assert.equal(
      created.ok,
      true,
      created.ok ? undefined : created.error.message
    );
  }
  browser([
    'goto',
    '--url',
    `${url}/datasets?custom=%22keep%22&custom=%5B1%2C2%5D`,
  ]);
  browser(['wait', '--text', 'Browser page 00']);
  waitTableInteractive();
  let snapshot = browser(['snapshot']);
  assert.match(snapshot.snapshot, /26 row\(s\)/);
  assert.doesNotMatch(snapshot.snapshot, /Browser page 24/);

  activateControl({ selector: '[aria-label="Next page"]' });
  browser([
    'wait',
    '--fn',
    `new URLSearchParams(location.search).get('page') === '2'`,
  ]);
  browser(['wait', '--text', 'Browser page 20']);
  snapshot = browser(['snapshot']);
  assert.match(snapshot.snapshot, /Browser page 24/);
  assert.doesNotMatch(snapshot.snapshot, /Browser page 00/);
  assert.deepEqual(new URL(snapshot.origin).searchParams.getAll('custom'), [
    '"keep"',
    '[1,2]',
  ]);
  browser(['reload']);
  browser(['wait', '--text', 'Browser page 20']);
  waitTableInteractive();
  assert.equal(
    new URL(browser(['snapshot']).origin).searchParams.get('page'),
    '2'
  );
  browser(['back']);
  browser(['wait', '--text', 'Browser page 00']);
  waitTableInteractive();
  assert.equal(
    new URL(browser(['snapshot']).origin).searchParams.get('page'),
    '1'
  );

  activateControl({ selector: '[aria-label="Next page"]' });
  browser(['wait', '--text', 'Browser page 20']);
  changePageSize('50');
  browser([
    'wait',
    '--fn',
    `new URLSearchParams(location.search).get('limit') === '50' && new URLSearchParams(location.search).get('page') === '1'`,
  ]);
  browser(['wait', '--text', 'Browser page 00']);
  snapshot = await waitForSnapshotText('Browser page 00');
  assert.match(snapshot.snapshot, /Browser page 24/);
  assert.match(
    snapshot.snapshot,
    /StaticText "1"\s+- StaticText " \/ "\s+- StaticText "1"/
  );

  activateControl({
    event: 'pointerdown',
    selector: 'th button',
    text: 'Name',
  });
  browser(['wait', '--text', 'Desc']);
  activateControl({ selector: '[role="menuitem"]', text: 'Desc' });
  browser([
    'wait',
    '--fn',
    `new URLSearchParams(location.search).get('sort') === 'name' && new URLSearchParams(location.search).get('order') === 'desc'`,
  ]);
  browser([
    'wait',
    '--fn',
    `document.querySelector('tbody tr[role="button"]')?.textContent.includes('questions/first,release')`,
  ]);

  browser([
    'goto',
    '--url',
    `${url}/datasets?page=2&limit=20&custom=%22keep%22&custom=%5B1%2C2%5D`,
  ]);
  browser(['wait', '--text', 'Browser page 20']);
  waitTableInteractive();
  snapshot = browser(['snapshot']);
  const input = findRef({ name: /Search by name/, role: 'textbox', snapshot });
  browser(['fill', '--element', `@${input}`, '--value', 'Browser page 00']);
  browser(['wait', '--text', '1 row(s)']);
  snapshot = browser(['snapshot']);
  assert.match(snapshot.snapshot, /Browser page 00/);
  assert.doesNotMatch(snapshot.snapshot, /Browser page 20/);
  assert.equal(new URL(snapshot.origin).searchParams.get('page'), '1');
  assert.deepEqual(new URL(snapshot.origin).searchParams.getAll('custom'), [
    '"keep"',
    '[1,2]',
  ]);

  const nextInput = findRef({
    name: /Search by name/,
    role: 'textbox',
    snapshot,
  });
  browser(['fill', '--element', `@${nextInput}`, '--value', 'Browser page 24']);
  browser(['wait', '--text', 'Browser page 24']);
  snapshot = browser(['snapshot']);
  assert.match(snapshot.snapshot, /1 row\(s\)/);
  assert.equal(
    new URL(snapshot.origin).searchParams.get('q'),
    'Browser page 24'
  );
  activateControl({ selector: '[title="Reset filters"]' });
  browser(['wait', '--text', '26 row(s)']);
  browser(['wait', '--text', 'Browser page 00']);
}

function changePageSize(size) {
  activateControl({ event: 'pointerdown', selector: '[role="combobox"]' });
  browser(['wait', '--selector', '[role="option"]']);
  activateControl({
    event: 'keydown',
    selector: '[role="option"]',
    text: size,
  });
  browser(['keypress', '--key', 'Escape']);
  browser([
    'wait',
    '--fn',
    `document.querySelector('[role="listbox"]') === null`,
  ]);
}

async function waitForSnapshotText(text) {
  const deadline = Date.now() + 10_000;
  while (true) {
    const snapshot = browser(['snapshot']);
    if (snapshot.snapshot.includes(text)) {
      return snapshot;
    }
    assert.ok(
      Date.now() < deadline,
      `Snapshot did not expose ${text}: ${snapshot.snapshot}`
    );
    await setTimeout(50);
  }
}

function activateControl({ selector, text, event = 'click' }) {
  // Orca ref activation misses native icon-only controls; dispatch their DOM events.
  browser([
    'eval',
    '--expression',
    `(() => {
    const controls = [...document.querySelectorAll(${JSON.stringify(selector)})].filter(element => ${text === undefined ? 'true' : `element.textContent.trim() === ${JSON.stringify(text)}`});
    if (controls.length !== 1 || !(controls[0] instanceof HTMLElement) || controls[0].matches(':disabled')) throw new Error('Expected one enabled control: ' + ${JSON.stringify(selector)});
    const control = controls[0];
    control.focus();
    if (${JSON.stringify(event)} === 'pointerdown') control.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'mouse' }));
    else if (${JSON.stringify(event)} === 'keydown') control.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));
    else control.click();
  })()`,
  ]);
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
