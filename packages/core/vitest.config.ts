import viteTsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [viteTsconfigPaths()],
  test: {
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'original'],
  },
});
