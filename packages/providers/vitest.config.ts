import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '#': new URL('./src', import.meta.url).pathname } },
  test: {
    environment: 'node',
    coverage: {
      include: ['src/**/*.ts'],
      exclude: [
        '**/*.test.*',
        '**/*.test-d.ts',
        '**/*.d.ts',
        'src/generated/**',
      ],
      reporter: ['text', 'json', 'json-summary', 'html'],
    },
    reporters: process.argv.includes('--coverage')
      ? ['default', ['blob', { outputFile: 'coverage/unit.blob.json' }]]
      : ['default'],
  },
});
