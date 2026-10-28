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
    'config/index': 'src/config/index.ts',
    'config/lifecycle': 'src/config/lifecycle.ts',
    'config/runner': 'src/config/runner.ts',
    'config/setup': 'src/config/setup.ts',
    'dataset/index': 'src/dataset/index.ts',
    'main/index': 'src/index.ts',
    'provider/index': 'src/provider/index.ts',
    'reporters/index': 'src/reporters/index.ts',
    'reporters/json': 'src/reporters/json.ts',
  },
  format: ['esm'],
  outDir: 'dist',
  platform: 'node',
  sourcemap: true,
  treeshake: true,
  tsconfig: 'tsconfig.build.json',
});
