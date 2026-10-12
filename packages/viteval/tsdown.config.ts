import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: true,
  dts: true,
  entry: [
    'src/index.ts',
    'src/config.ts',
    'src/dataset.ts',
    'src/reporters.ts',
    'src/provider.ts',
  ],
  format: ['esm'],
  sourcemap: true,
  target: 'es2022',
  treeshake: false,
});
