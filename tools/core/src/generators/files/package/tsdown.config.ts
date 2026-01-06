import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  splitting: false,
  sourcemap: true,
  clean: false,
  target: 'es2015',
  outDir: 'dist',
  minify: false,
  dts: true,
});
