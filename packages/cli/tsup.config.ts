import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false,
  clean: true,
  target: 'es2022',
  splitting: false,
  sourcemap: true,
  minify: false,
  external: ['vitest', 'find-up', 'yargs'],
});
