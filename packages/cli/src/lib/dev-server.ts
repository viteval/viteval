import { exec } from 'node:child_process';
import path from 'node:path';

export async function startDevServer() {
  await new Promise((resolve, reject) => {
    exec(
      `node ${path.join(import.meta.dirname, '..', '..', 'node_modules/@viteval/ui/.output/server/index.mjs')}`,
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
        }

        if (stderr) {
          reject(stderr);
        }

        resolve(stdout);
      }
    );
  });
}
