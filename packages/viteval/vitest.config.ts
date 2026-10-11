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
