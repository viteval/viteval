import assert from 'node:assert/strict';
import { test } from 'node:test';
import { projectSourceCoverage } from './project-source-coverage.mjs';

const location = (line) => ({
  start: { line, column: 0 },
  end: { line, column: 10 },
});
const source = {
  '/source.ts': {
    path: '/source.ts',
    statementMap: { 0: location(1), 1: location(2) },
    fnMap: { 0: { name: 'run', loc: location(1), decl: location(1) } },
    branchMap: {
      0: {
        type: 'if',
        loc: location(2),
        locations: [location(3), location(4)],
      },
    },
    s: { 0: 0, 1: 0 },
    f: { 0: 0 },
    b: { 0: [0, 0] },
  },
};

test('preserves every source slot and combines only matching remapped hits', () => {
  const original = structuredClone(source);
  const report = structuredClone(source);
  report['/source.ts'].s = { 0: 4, 1: 0, 2: 0 };
  report['/source.ts'].statementMap[2] = location(99);
  report['/source.ts'].f[0] = 4;
  report['/source.ts'].b[0] = [4, 0];
  const result = projectSourceCoverage(source, [report]);
  assert.deepEqual(
    result['/source.ts'].statementMap,
    source['/source.ts'].statementMap
  );
  assert.deepEqual(result['/source.ts'].s, { 0: 4, 1: 0 });
  assert.deepEqual(result['/source.ts'].f, { 0: 4 });
  assert.deepEqual(result['/source.ts'].b, { 0: [4, 0] });
  assert.deepEqual(source, original);
});

test('does not confuse different branch types or unmatched source locations', () => {
  const report = structuredClone(source);
  report['/source.ts'].statementMap[0] = location(99);
  report['/source.ts'].s[0] = 8;
  report['/source.ts'].branchMap[0].type = 'cond-expr';
  report['/source.ts'].b[0] = [8, 8];
  const result = projectSourceCoverage(source, [report, {}]);
  assert.deepEqual(result['/source.ts'].s, { 0: 0, 1: 0 });
  assert.deepEqual(result['/source.ts'].b, { 0: [0, 0] });
});
