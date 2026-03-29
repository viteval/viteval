import { defineConfig } from 'tsdown';

const baseConfig = defineConfig({
  config: 'tsconfig.build.json',
  dts: { build: true },
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
  format: ['esm'],
  platform: 'node',
  sourcemap: true,
  splitting: false,
  treeshake: true,
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
