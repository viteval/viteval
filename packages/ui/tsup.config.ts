import fs from 'node:fs/promises';
import path from 'node:path';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['server.ts'],
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.js',
    };
  },
  bundle: false,
  outDir: 'dist',
  format: ['esm'],
  dts: true,
  clean: true,
  target: 'esnext',
  splitting: false,
  sourcemap: true,
  minify: true,
  async onSuccess() {
    await fs.cp(
      path.join(import.meta.dirname, '.output'),
      path.join(import.meta.dirname, 'dist', '.output'),
      {
        recursive: true,
      }
    );
  },
});
