import { defineConfig } from 'tsdown';

const baseConfig = defineConfig({
  format: ['esm'],
  dts: { build: true },
  splitting: false,
  config: 'tsconfig.build.json',
  sourcemap: true,
  treeshake: true,
  platform: 'node',
  external: [
    'vitest',
    'openai',
    'autoevals',
    '@viteval/internal',
    /^vitest\//,
    /^vite\//,
    /^@vitest\//,
    'fsevents',
    'lightningcss',
  ],
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
