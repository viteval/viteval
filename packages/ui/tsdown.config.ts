import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: false,
  dts: { generator: 'tsgo' },
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
  target: 'esnext',
  tsconfig: 'tsconfig.server.json',
  unbundle: true,
});
