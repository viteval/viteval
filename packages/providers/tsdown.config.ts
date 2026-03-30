import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/viteval.ts', 'src/braintrust.ts'],
  format: 'esm',
  splitting: false,
  sourcemap: true,
  clean: true,
  target: 'esnext',
  outDir: 'dist',
  minify: false,
  dts: { build: true },
  config: 'tsconfig.json',
  platform: 'node',
  external: [
    '@viteval/core',
    '@viteval/internal',
    '@prisma/client',
    '@braintrust/api',
  ],
});
