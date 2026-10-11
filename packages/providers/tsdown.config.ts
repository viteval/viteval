import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: true,
  deps: {
    neverBundle: [
      '@viteval/core',
      '@viteval/internal',
      '@prisma/client',
      '@prisma/adapter-better-sqlite3',
      '@prisma/adapter-pg',
      'better-sqlite3',
      'pg',
      '@braintrust/api',
    ],
  },
  dts: { generator: 'tsgo' },
  entry: ['src/index.ts', 'src/viteval.ts', 'src/braintrust.ts'],
  format: 'esm',
  minify: false,
  outDir: 'dist',
  platform: 'node',
  sourcemap: true,
  target: 'esnext',
  tsconfig: 'tsconfig.json',
});
