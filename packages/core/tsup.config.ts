import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/config/index.ts',
    // TODO: add reporters
    // src/reporters/index.ts
  ],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['vitest', 'openai', 'autoevals'],
});
