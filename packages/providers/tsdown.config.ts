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
