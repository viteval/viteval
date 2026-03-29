import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: false,
  dts: true,
  entry: ['server.ts'],
  format: ['esm'],
  minify: true,
  outDir: '.',
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.js',
    };
  },
  sourcemap: true,
  splitting: false,
  target: 'esnext',
  unbundle: true,
});
