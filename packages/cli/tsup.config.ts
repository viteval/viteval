import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false,
  clean: true,
  target: 'es2022',
  splitting: true,
  sourcemap: true,
  minify: true,
  external: ['vitest', 'find-up', 'yargs', 'consola'],
  publicDir: 'src/templates',
});
