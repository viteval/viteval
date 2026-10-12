import { defineConfig } from 'tsdown';

export default defineConfig({
  deps: {
    neverBundle: [
      'vite',
      'vitest',
      'openai',
      '@viteval/internal',
      /^vitest\//,
      /^vite\//,
      /^@vitest\//,
      'fsevents',
      'lightningcss',
    ],
  },
  dts: { generator: 'tsgo' },
  entry: {
    'provider/index': 'src/provider/index.ts',
    'config/index': 'src/config/index.ts',
    'dataset/index': 'src/dataset/index.ts',
    'main/index': 'src/index.ts',
    'reporters/index': 'src/reporters/index.ts',
  },
  format: ['esm'],
  outDir: 'dist',
  platform: 'node',
  sourcemap: true,
  tsconfig: 'tsconfig.build.json',
  treeshake: true,
});
