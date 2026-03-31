import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: true,
  config: 'tsconfig.json',
  dts: { build: true },
  entry: ['src/index.ts', 'src/viteval.ts', 'src/braintrust.ts'],
  external: [
    '@viteval/core',
    '@viteval/internal',
    '@prisma/client',
    '@prisma/adapter-better-sqlite3',
    '@prisma/adapter-pg',
    'better-sqlite3',
    'pg',
    '@braintrust/api',
  ],
  format: 'esm',
  minify: false,
  outDir: 'dist',
  platform: 'node',
  sourcemap: true,
  splitting: false,
  target: 'esnext',
});
