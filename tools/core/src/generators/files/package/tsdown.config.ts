import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: false,
  dts: true,
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  minify: false,
  outDir: 'dist',
  sourcemap: true,
  target: 'es2015',
});
