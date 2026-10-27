import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: ['**/*.d.ts', '**/*.{test,spec}.ts'],
      include: ['src/**/*.ts'],
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
    },
    environment: 'node',
    include: ['**/*.{test,spec}.ts'],
    reporters: process.argv.includes('--coverage')
      ? ['default', ['blob', { outputFile: 'coverage/unit.blob.json' }]]
      : ['default'],
  },
});
