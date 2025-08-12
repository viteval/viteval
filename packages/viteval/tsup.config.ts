import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/config.ts', 'src/cli.ts'],
  format: ['esm'],
  dts: true,
  target: 'es2022',
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: false,
  // banner: {
  //   js: '#!/usr/bin/env node',
  // },
  // external: ['@viteval/core', '@viteval/cli'], // Don't bundle dependencies
});
