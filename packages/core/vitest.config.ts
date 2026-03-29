import viteTsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [viteTsconfigPaths()],
  test: {
    environment: 'node',
    exclude: ['node_modules', 'dist', 'original'],
    globals: true,
    include: ['**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
