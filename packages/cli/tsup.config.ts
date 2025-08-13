import fs from 'node:fs/promises';
import path from 'node:path';
import { defineConfig } from 'tsup';

const OUTPUT_DIR = path.join(import.meta.dirname, 'dist');
const TEMPLATES_DIR = path.join(import.meta.dirname, 'src', 'templates');

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: OUTPUT_DIR,
  format: ['esm'],
  dts: false,
  clean: true,
  target: 'es2022',
  splitting: false,
  sourcemap: true,
  minify: true,
  external: [
    'vitest',
    'find-up',
    'yargs',
    'consola',
    'ts-pattern',
    // '@viteval/core',
    // '@viteval/internal',
  ],
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
});
