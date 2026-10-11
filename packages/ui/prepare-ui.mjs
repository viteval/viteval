import { cp, writeFile } from 'node:fs/promises';
import path from 'node:path';

const standalone = path.join(
  import.meta.dirname,
  'dist',
  '.next',
  'standalone'
);
const ui = path.join(standalone, 'packages', 'ui');
await cp(path.join(import.meta.dirname, 'public'), path.join(ui, 'public'), {
  recursive: true,
});
await cp(
  path.join(import.meta.dirname, 'dist', '.next', 'static'),
  path.join(ui, 'dist', '.next', 'static'),
  { recursive: true }
);
// Next's generated server is CommonJS even when the published wrapper is ESM.
await writeFile(
  path.join(standalone, 'package.json'),
  JSON.stringify({ type: 'commonjs' })
);
