import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const repository = path.resolve(import.meta.dirname, '..');
const packages = ['internal', 'core', 'providers', 'ui', 'cli', 'viteval'];
const pnpmPath = process.env.npm_execpath;
if (!pnpmPath) throw new Error('Run this check with pnpm validate:consumer');
const temporary = await mkdtemp(path.join(tmpdir(), 'viteval-consumer-'));
const isScript = /\.[cm]?js$/.test(pnpmPath);
const executable = isScript ? process.execPath : pnpmPath;
const prefix = isScript ? [pnpmPath] : [];

function pnpm(args, cwd = repository) {
  return execFileSync(executable, [...prefix, ...args], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 180_000,
  });
}

let ui;
try {
  const packed = {};
  await mkdir(path.join(temporary, 'packages'));
  for (const name of packages) {
    const manifest = JSON.parse(
      await readFile(
        path.join(repository, 'packages', name, 'package.json'),
        'utf8'
      )
    );
    const tarball = path.join(temporary, 'packages', `${name}.tgz`);
    pnpm(['--filter', manifest.name, 'pack', '--out', tarball]);
    packed[manifest.name] = `file:${tarball}`;
  }
  const project = path.join(temporary, 'consumer');
  await mkdir(project);
  await writeFile(
    path.join(project, 'package.json'),
    JSON.stringify(
      {
        name: 'viteval-release-consumer',
        private: true,
        type: 'module',
        dependencies: {
          viteval: packed.viteval,
          '@viteval/providers': packed['@viteval/providers'],
        },
      },
      null,
      2
    )
  );
  const workspace = await readFile(
    path.join(repository, 'pnpm-workspace.yaml'),
    'utf8'
  );
  const overrides = Object.entries(packed)
    .map(([name, file]) => `  ${JSON.stringify(name)}: ${JSON.stringify(file)}`)
    .join('\n');
  await writeFile(
    path.join(project, 'pnpm-workspace.yaml'),
    `packages: []\noverrides:\n${overrides}\n${workspace.slice(workspace.indexOf('allowBuilds:'))}`
  );
  process.stdout.write(
    'Installing packed packages in an isolated consumer...\n'
  );
  pnpm(['install', '--no-frozen-lockfile'], project);
  const cli = path.join(project, 'node_modules', 'viteval', 'cli.mjs');
  const run = (args) =>
    execFileSync(process.execPath, [cli, ...args], {
      cwd: project,
      encoding: 'utf8',
      timeout: 30_000,
    });
  run(['init', '--no-env-file']);
  run(['run']);
  const resultsDirectory = path.join(project, '.viteval', 'results');
  const files = await readdir(resultsDirectory);
  assert.equal(files.length, 1);
  const report = JSON.parse(
    await readFile(path.join(resultsDirectory, files[0]), 'utf8')
  );
  assert.equal(report.success, true);
  assert.equal(report.numPassedEvals, 2);
  await writeFile(
    path.join(project, 'src', 'smoke.dataset.ts'),
    "import { defineDataset } from 'viteval/dataset';\nexport default defineDataset({ name: 'smoke', data: async () => [{ input: 'question', expected: 'answer' }] });\n"
  );
  run(['data', '--overwrite']);
  const dataset = JSON.parse(
    await readFile(
      path.join(project, '.viteval', 'datasets', 'smoke.json'),
      'utf8'
    )
  );
  assert.deepEqual(dataset.data, [{ input: 'question', expected: 'answer' }]);

  await writeFile(
    path.join(project, 'src', 'discovery.eval.ts'),
    `import { evaluate } from 'viteval';
import { defineDataset } from 'viteval/dataset';
let calls = 0;
const inline = defineDataset({ name: 'packed-inline', data: async () => {
  if (++calls !== 1) throw new Error('inline dataset generated twice');
  return [{ input: 'inline', expected: 'answer' }];
} });
export const named = defineDataset({ name: 'packed-named', data: async () => [{ input: 'named', expected: 'answer' }] });
export { named as default };
evaluate('must not execute', { data: inline, task: () => { throw new Error('eval task executed during generation'); }, scorers: [() => { throw new Error('scorer executed during generation'); }] });
`
  );
  const generated = run(['data', 'src/discovery.eval.ts']);
  assert.match(generated, /Generated 2 datasets/);
  for (const name of ['packed-inline', 'packed-named']) {
    const saved = JSON.parse(
      await readFile(
        path.join(project, '.viteval', 'datasets', `${name}.json`),
        'utf8'
      )
    );
    assert.equal(saved.data.length, 1);
  }
  assert.equal((await readdir(resultsDirectory)).length, 1);

  await writeFile(
    path.join(project, 'optional-providers.mjs'),
    `import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { viteval } from '@viteval/providers';
import { braintrust } from '@viteval/providers/braintrust';
import { langfuse } from '@viteval/providers/langfuse';
import { voltops } from '@viteval/providers/voltops';
import { s3 } from '@viteval/providers/s3';
import { gcs } from '@viteval/providers/gcs';
const require = createRequire(import.meta.resolve('@viteval/providers'));
for (const dependency of ['@aws-sdk/client-s3', '@google-cloud/storage', '@braintrust/api', '@langfuse/client', '@voltagent/sdk', '@prisma/client', '@prisma/adapter-better-sqlite3', 'better-sqlite3']) {
  assert.throws(() => require.resolve(dependency), { code: 'MODULE_NOT_FOUND' });
}
const json = viteval(); assert.equal((await json.initialize()).ok, true);
const options = { publicKey: 'fixture-public', secretKey: 'fixture-secret' };
for (const provider of [braintrust({ project: 'fixture', apiKey: 'fixture' }), langfuse(options), voltops(options), s3({ bucket: 'fixture' }), gcs({ bucket: 'fixture' }), viteval({ database: 'sqlite' })]) {
  const initialized = await provider.initialize();
  assert.equal(initialized.ok, false, provider.name);
  assert.match(initialized.error.message, /[Ii]nstall|requires/);
  await provider.close();
}
await json.close();
`
  );
  execFileSync(process.execPath, ['optional-providers.mjs'], {
    cwd: project,
    stdio: 'inherit',
    timeout: 30_000,
  });
  const providerManifest = JSON.parse(
    await readFile(
      path.join(repository, 'packages/providers/package.json'),
      'utf8'
    )
  );
  pnpm(
    [
      'add',
      '--save-dev',
      ...[
        '@prisma/client',
        '@prisma/adapter-better-sqlite3',
        'better-sqlite3',
      ].map((name) => `${name}@${providerManifest.peerDependencies[name]}`),
    ],
    project
  );

  await writeFile(
    path.join(project, 'sqlite-smoke.mjs'),
    `import assert from 'node:assert/strict';
import { viteval } from '@viteval/providers/viteval';
const json = viteval(); assert.equal(json.name, 'json');
const provider = viteval({ database: 'sqlite', path: './.viteval/smoke.db' });
try {
  const initialized = await provider.initialize(); if (!initialized.ok) throw initialized.error;
  const created = await provider.datasets.create({ name: 'smoke', items: [{ input: 'q', expected: 'a' }] });
  if (!created.ok) throw created.error;
  const loaded = await provider.datasets.getItems({ datasetId: created.value.id });
  if (!loaded.ok) throw loaded.error;
  assert.equal(loaded.value[0].input, 'q');
} finally { await provider.close(); }
`
  );
  execFileSync(process.execPath, ['sqlite-smoke.mjs'], {
    cwd: project,
    stdio: 'inherit',
    timeout: 30_000,
  });
  ui = spawn(process.execPath, [cli, 'ui', '--debug'], {
    cwd: project,
    stdio: 'pipe',
  });
  const exited = new Promise((resolve, reject) => {
    ui.once('exit', resolve);
    ui.once('error', reject);
  });
  let logs = '';
  let timeout;
  try {
    const url = await new Promise((resolve, reject) => {
      timeout = setTimeout(
        () => reject(new Error(`Installed UI did not start: ${logs}`)),
        15_000
      );
      const onData = (chunk) => {
        logs += String(chunk);
        const match = logs.match(
          /View the results at (http:\/\/localhost:\d+)/
        );
        if (match) resolve(match[1]);
      };
      ui.stdout.on('data', onData);
      ui.stderr.on('data', onData);
      exited.then(
        (code) =>
          reject(new Error(`Installed UI exited with ${code}: ${logs}`)),
        reject
      );
    });
    clearTimeout(timeout);
    let response;
    try {
      response = await fetch(`${url}/api/results`);
    } catch (error) {
      throw new Error(`Installed UI request failed: ${logs}`, { cause: error });
    }
    assert.equal(response.status, 200, logs);
    const listing = await response.json();
    assert.equal(listing.total, 1);
    const detail = await fetch(`${url}/api/results/${listing.data[0].id}`);
    assert.equal(detail.status, 200);
    assert.equal((await detail.json()).numPassedEvals, 2);
    const page = await fetch(`${url}/results`);
    assert.equal(page.status, 200, logs);
    const html = await page.text();
    assert.match(page.headers.get('content-type'), /text\/html/);
    assert.match(
      ssrText(html),
      /View and analyze your evaluation results \(1 total\)/
    );
    const assets = [
      ...new Set(
        [
          ...html.matchAll(
            /["']([^"'<>]*\/assets\/[^"'<>]+\.(?:js|css)(?:\?[^"'<>]*)?)["']/g
          ),
        ].map((match) => match[1].replaceAll('&amp;', '&'))
      ),
    ];
    for (const extension of ['js', 'css'])
      assert.ok(
        assets.some((asset) =>
          new URL(asset, url).pathname.endsWith(`.${extension}`)
        ),
        `Dashboard HTML must reference compiled Vite ${extension} assets`
      );
    for (const asset of assets) {
      const assetResponse = await fetch(new URL(asset, url));
      assert.equal(
        assetResponse.status,
        200,
        `Missing dashboard asset: ${asset}`
      );
      assert.match(
        assetResponse.headers.get('content-type'),
        new URL(asset, url).pathname.endsWith('.css')
          ? /text\/css/
          : /(?:text|application)\/javascript/,
        `Dashboard asset must not fall back to HTML: ${asset}`
      );
      assert.ok((await assetResponse.text()).trim().length > 0, asset);
    }
    const datasetsResponse = await fetch(`${url}/api/datasets`);
    assert.equal(datasetsResponse.status, 200);
    const datasets = await datasetsResponse.json();
    const smoke = datasets.data.find((item) => item.name === 'smoke');
    assert.ok(smoke, 'Dashboard must read the consumer-generated dataset');
    const suitesResponse = await fetch(`${url}/api/suites`);
    assert.equal(suitesResponse.status, 200);
    const suites = await suitesResponse.json();
    const uppercase = suites.data.find((item) => item.name === 'Uppercase');
    assert.ok(uppercase, 'Dashboard must read the consumer evaluation suite');
    for (const [pathname, content] of [
      ['/', /Latest Results/],
      ['/datasets', /smoke/],
      ['/suites', /Uppercase/],
      [`/results/${encodeURIComponent(listing.data[0].id)}`, /Uppercase/],
      [`/datasets/${encodeURIComponent(smoke.id)}`, /Items/],
      [`/suites/${encodeURIComponent(uppercase.slug)}`, /Uppercase/],
      ['/settings', /Preferences/],
    ]) {
      const rendered = await fetch(`${url}${pathname}`);
      assert.equal(rendered.status, 200, `${pathname}: ${logs}`);
      assert.match(rendered.headers.get('content-type'), /text\/html/);
      assert.match(
        ssrText(await rendered.text()),
        content,
        `Missing SSR content: ${pathname}`
      );
    }
    for (const pathname of [
      '/missing-dashboard-page',
      '/results/missing',
      '/datasets/missing',
      '/suites/missing',
    ]) {
      const missing = await fetch(`${url}${pathname}`);
      assert.equal(missing.status, 404, pathname);
      assert.match(ssrText(await missing.text()), /not found/i, pathname);
    }
    const missingResult = await fetch(`${url}/api/results/missing`);
    assert.equal(missingResult.status, 404);
    assert.deepEqual(await missingResult.json(), { error: 'Not found' });
    const missingAsset = await fetch(`${url}/assets/missing-release-check.js`);
    assert.equal(missingAsset.status, 404);
    ui.kill('SIGTERM');
    assert.equal(await exited, 0);
  } finally {
    clearTimeout(timeout);
    ui.kill('SIGTERM');
    await exited;
  }
  process.stdout.write(
    'Packed consumer passed: init, evals, JSON datasets, named/inline eval-file discovery, optional provider imports/missing-SDK diagnostics, opt-in SQLite, UI SSR/deep links, Vite JS/CSS assets, and API/404 behavior.\n'
  );
} finally {
  ui?.kill('SIGTERM');
  await rm(temporary, { recursive: true, force: true });
}

function ssrText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '');
}
