import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '#': new URL('src', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      include: ['src/**/*.ts', 'cli.mjs'],
      exclude: ['**/*.test.*', '**/*.d.ts'],
      reporter: ['text', 'json', 'json-summary', 'html'],
    },
    reporters: process.argv.includes('--coverage')
      ? ['default', ['blob', { outputFile: 'coverage/unit.blob.json' }]]
      : ['default'],
  },
});
