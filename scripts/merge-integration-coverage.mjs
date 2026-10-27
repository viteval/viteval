import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { createVitest } from 'vitest/node';
import { projectSourceCoverage } from './project-source-coverage.mjs';

const root = path.resolve(import.meta.dirname, '../packages/viteval');
const repository = path.resolve(root, '../..');
const blobs = path.join(root, 'coverage/integration-blobs');
const reportsDirectory = path.join(root, 'coverage/repository');
assert.ok(
  (await readdir(blobs)).length > 0,
  'Native-worker coverage blobs were not produced'
);
const source = {};
const production =
  /\/packages\/(?:core|cli|internal|providers|ui|viteval)\/(?:src\/|(?:production-server|server)\.ts$|cli\.mjs$)/;
const support =
  /(?:\.test(?:-d)?\.|\.spec\.|\.d\.ts$|\/generated\/|\.gen\.ts$|\/(?:test-icons|test-fixtures)\.ts$)/;
const reports = [];
for (const name of ['core', 'cli', 'internal', 'providers', 'ui', 'viteval']) {
  const report = JSON.parse(
    await readFile(
      path.join(repository, 'packages', name, 'coverage/coverage-final.json'),
      'utf8'
    )
  );
  reports.push(report);
  for (const [file, coverage] of Object.entries(report)) {
    if (production.test(file) && !support.test(file) && !source[file])
      source[file] = coverage;
  }
}
const runs = path.join(root, 'coverage/integration-runs');
for (const directory of await readdir(runs)) {
  reports.push(
    JSON.parse(
      await readFile(path.join(runs, directory, 'coverage-final.json'), 'utf8')
    )
  );
}
const coverage = projectSourceCoverage(source, reports);
const vitest = await createVitest({
  config: false,
  root: repository,
  resolve: { tsconfigPaths: true },
  watch: false,
  reporters: [],
  projects: ['', 'first', 'second'].map((name) => ({
    test: { name, include: [] },
  })),
  coverage: {
    enabled: true,
    clean: false,
    provider: 'v8',
    allowExternal: true,
    include: [
      'packages/*/src/**/*.{ts,tsx}',
      'packages/*/dist/**/*.{mjs,js}',
      'packages/ui/{server,production-server}.{ts,mjs}',
      'packages/{cli,viteval}/cli.mjs',
    ],
    exclude: [
      '**/*.test.*',
      '**/*.test-d.ts',
      '**/*.spec.*',
      '**/*.d.ts',
      '**/generated/**',
      '**/*.gen.ts',
      '**/test-icons.ts',
      '**/test-fixtures.ts',
      '**/dist/client/**',
      '**/dist/server/**',
    ],
    excludeAfterRemap: true,
    reportsDirectory,
    reporter: ['text', 'json', 'json-summary', 'html'],
    reportOnFailure: true,
    thresholds: {
      'packages/{core,cli,internal,providers,viteval}/**': {
        lines: 100,
        statements: 100,
        functions: 100,
        branches: 100,
        perFile: true,
      },
    },
  },
});
try {
  const provider = await vitest.createCoverageProvider();
  assert.ok(provider, 'The V8 coverage provider must initialize');
  await provider.mergeReports([coverage]);
  const evaluator = Object.entries(coverage).find(([file]) =>
    file.endsWith('/evaluate/evaluate.ts')
  );
  assert.ok(
    evaluator,
    'Coverage must map the installed evaluator back to TypeScript source'
  );
  assert.ok(
    Object.values(evaluator[1].s).some((count) => count > 0),
    'Native-worker evaluation statements must be covered'
  );
  process.stdout.write(
    `Repository production coverage merged into ${reportsDirectory}\n`
  );
} finally {
  await vitest.close();
}
