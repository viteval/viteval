import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import viteUnpluginIcon from 'unplugin-icons/vite';
import { defineConfig } from 'vite';
import viteTsConfigPaths from 'vite-tsconfig-paths';

const config = defineConfig({
  plugins: [
    // This is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    viteUnpluginIcon({
      autoInstall: true,
      compiler: 'jsx',
      defaultClass: 'icon',
      jsx: 'react',
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
});

export default config;
