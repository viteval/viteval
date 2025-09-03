import { defineConfig } from 'tsup';

const baseConfig = defineConfig({
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  treeshake: true,
  external: ['vitest', 'openai', 'autoevals'],
});

export default defineConfig(
  [
    { entry: 'src/index.ts', outDir: 'dist/main' },
    { entry: 'src/config/index.ts', outDir: 'dist/config' },
    { entry: 'src/dataset/index.ts', outDir: 'dist/dataset' },
    { entry: 'src/reporters/index.ts', outDir: 'dist/reporters' },
  ].map(({ entry, outDir }) => ({
    ...baseConfig,
    entry: [entry],
    outDir,
  }))
);
