import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createDatasetWorker } from './worker';

describe('createDatasetWorker', () => {
  it.each([false, true])(
    'should emit valid worker modules with URL-safe imports (overwrite: %s)',
    (overwrite) => {
      const file = '/app/quoted "name" %#.dataset.ts',
        bootstrap = '/app/.viteval/setup %#.mjs',
        source = createDatasetWorker({
          files: [file],
          root: '/app/root %#',
          overwrite,
          bootstrap,
        }),
        checked = spawnSync(
          process.execPath,
          ['--check', '--input-type=module'],
          { input: source, encoding: 'utf8' }
        );
      expect(checked.status, checked.stderr).toBe(0);
      expect(source).toContain(JSON.stringify(pathToFileURL(file).href));
      expect(source).toContain(JSON.stringify(pathToFileURL(bootstrap).href));
      expect(source).toContain(`overwrite: ${overwrite}`);
      expect(source).toContain('root: "/app/root %#"');
    }
  );
});
