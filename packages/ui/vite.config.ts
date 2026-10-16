import { createRequire } from 'node:module';
import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const require = createRequire(import.meta.url);

export default defineConfig({
  server: { port: 6274 },
  resolve: {
    tsconfigPaths: true,
    alias: {
      'geist-fonts': path.join(
        path.dirname(require.resolve('geist/font')),
        'fonts'
      ),
    },
  },
  plugins: [tanstackStart(), viteReact(), tailwindcss()],
});
