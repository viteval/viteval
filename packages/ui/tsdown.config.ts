import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['server.ts'],
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.js',
    };
  },
  unbundle: true,
  outDir: '.',
  format: ['esm'],
  dts: true,
  clean: false,
  target: 'esnext',
  splitting: false,
  sourcemap: true,
  minify: true,
});
