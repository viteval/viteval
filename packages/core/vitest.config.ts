import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    exclude: ['node_modules', 'dist', 'original'],
    globals: true,
    include: ['**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    reporters: process.argv.includes('--coverage')
      ? [
          'default',
          [
            'blob',
            {
              outputFile: new URL('./coverage/unit.blob.json', import.meta.url)
                .pathname,
            },
          ],
        ]
      : ['default'],
  },
});
