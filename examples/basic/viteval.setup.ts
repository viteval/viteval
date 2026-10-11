import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import { createJsonProvider, initializeProvider } from 'viteval/provider';

const envFile = new URL('.env', import.meta.url);
if (existsSync(envFile)) {
  loadEnvFile(envFile);
}

const initialized = await initializeProvider({
  datasets: createJsonProvider({
    root: fileURLToPath(new URL('.', import.meta.url)),
  }),
});
if (!initialized.ok) throw initialized.error;
