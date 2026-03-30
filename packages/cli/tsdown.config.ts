import fs from 'node:fs/promises';
import path from 'node:path';
import { defineConfig } from 'tsdown';

const OUTPUT_DIR = path.join(import.meta.dirname, 'dist');
const TEMPLATES_DIR = path.join(import.meta.dirname, 'src', 'templates');

export default defineConfig({
  clean: true,
  dts: false,
  entry: ['src/index.ts'],
  external: [
    'vitest',
    'find-up',
    'yargs',
    'consola',
    'ts-pattern',
    '@viteval/core',
    '@viteval/internal',
    '@viteval/ui',
    /^vitest\//,
    /^vite\//,
    /^@vitest\//,
    'fsevents',
    'lightningcss',
  ],
  format: ['esm'],
  minify: true,
  async onSuccess() {
    const files = await fs.readdir(TEMPLATES_DIR);
    for (const file of files) {
      if (file.endsWith('.template')) {
        await fs.copyFile(
          path.join(TEMPLATES_DIR, file),
          path.join(OUTPUT_DIR, file)
        );
      }
    }
  },
  outDir: OUTPUT_DIR,
  platform: 'node',
  sourcemap: true,
  splitting: false,
  target: 'es2022',
});
