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
  },
});

declare module 'vitest' {
  export interface ProvidedContext {
    integrationCoverage: boolean;
  }
}
