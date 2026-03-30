import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index.ts', 'src/config.ts', 'src/dataset.ts'],
  format: ['esm'],
  sourcemap: true,
  splitting: false,
  target: 'es2022',
  treeshake: false,
});
