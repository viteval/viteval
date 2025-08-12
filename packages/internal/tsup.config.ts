import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  splitting: false,
  sourcemap: true,
  clean: true,
  target: 'esnext',
  outDir: 'dist',
  minify: true,
  dts: true,
  esbuildOptions(options) {
    options.keepNames = true;
    return options;
  },
});
