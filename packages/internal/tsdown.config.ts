import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  splitting: false,
  sourcemap: true,
  clean: true,
  target: 'esnext',
  outDir: 'dist',
  minify: false,
  dts: true,
});
