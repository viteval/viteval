import assert from 'node:assert/strict';
import { copyFile, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { createVitest } from 'vitest/node';

const root = path.resolve(import.meta.dirname, '../packages/viteval');
const blobs = path.join(root, 'coverage/integration-blobs');
const reportsDirectory = path.join(root, 'coverage/native-workers');
assert.ok(
  (await readdir(blobs)).length > 0,
  'Native-worker coverage blobs were not produced'
);
await copyFile(
  path.resolve(root, '../core/coverage/unit.blob.json'),
  path.join(blobs, 'core-unit.json')
);
const vitest = await createVitest({
  config: false,
  root,
  watch: false,
  reporters: [],
  projects: ['', 'first', 'second'].map((name) => ({
    test: { name, include: [] },
  })),
  coverage: {
    enabled: true,
    provider: 'v8',
    allowExternal: true,
    reportsDirectory,
    reporter: ['text', 'json', 'json-summary', 'html'],
    reportOnFailure: true,
  },
});
try {
  // The contract harness has already checked these intentionally passing/failing fixtures.
  await vitest.mergeReports(blobs);
  const coverage = JSON.parse(
    await readFile(path.join(reportsDirectory, 'coverage-final.json'), 'utf8')
  );
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
    `Native-worker coverage merged into ${reportsDirectory}\n`
  );
} finally {
  await vitest.close();
}
