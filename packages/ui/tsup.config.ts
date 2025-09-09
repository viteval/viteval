import { defineConfig } from 'tsup';

// try {
//   // Clean up the dist directory
//   const exists = await fs
//     .access(path.join(import.meta.dirname, 'dist', '.output', 'node_modules'))
//     .then(() => true)
//     .catch(() => false);
//   if (exists) {
//     await fs.rm(
//       path.join(import.meta.dirname, 'dist', '.output', 'node_modules'),
//       {
//         recursive: true,
//         force: true,
//       }
//     );
//   }

//   await fs.cp(
//     path.join(import.meta.dirname, '.output'),
//     path.join(import.meta.dirname, 'dist', '.output'),
//     {
//       recursive: true,
//       // dereference: true,
//       verbatimSymlinks: true,
//     }
//   );
// } finally {
//   // do nothing
// }

export default defineConfig({
  entry: ['server.ts'],
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.js',
    };
  },
  bundle: false,
  outDir: 'dist',
  format: ['esm'],
  dts: true,
  clean: false,
  target: 'esnext',
  splitting: false,
  sourcemap: true,
  minify: true,
});
