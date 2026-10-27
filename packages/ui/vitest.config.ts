import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test-icons.ts'],
    coverage: {
      include: ['src/**/*.{ts,tsx}', 'server.ts', 'production-server.ts'],
      exclude: [
        '**/*.test.*',
        '**/*.d.ts',
        '**/*.gen.ts',
        'src/test-icons.ts',
        'src/sdk/test-fixtures.ts',
      ],
      reporter: ['text', 'json', 'json-summary', 'html'],
    },
    reporters: process.argv.includes('--coverage')
      ? ['default', ['blob', { outputFile: 'coverage/unit.blob.json' }]]
      : ['default'],
  },
});
