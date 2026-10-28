import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '#': new URL('src', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'node',
    include: ['*.test.ts'],
    globals: true,
    testTimeout: 30_000,
    provide: {
      integrationCoverage: process.argv.includes('--coverage'),
    },
    coverage: {
      autoAttachSubprocess: true,
      allowExternal: true,
      // Unit reports include every source; collect only executed subprocess modules here.
      exclude: [
        '**/node_modules/**',
        '**/.test-*/**',
        '**/coverage-fixture.ts',
        '**/vitest.config.*',
        '**/*.test.*',
        '**/*.test-d.ts',
        '**/*.spec.*',
        '**/*.d.ts',
        '**/generated/**',
        '**/*.gen.ts',
        '**/test-icons.ts',
        '**/test-fixtures.ts',
        '**/dist/client/**',
        '**/dist/server/**',
      ],
      excludeAfterRemap: true,
      reporter: ['text', 'json', 'json-summary', 'html'],
    },
    reporters: process.argv.includes('--coverage')
      ? ['default', ['blob', { outputFile: 'coverage/unit.blob.json' }]]
      : ['default'],
  },
});

declare module 'vitest' {
  export interface ProvidedContext {
    integrationCoverage: boolean;
  }
}
