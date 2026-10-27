export { viteval } from './viteval/provider';
export type {
  VitevalProviderOptions,
  VitevalSqliteOptions,
  VitevalPostgresOptions,
} from './viteval/types';

declare module '@viteval/core' {
  interface ProviderRegistry {
    viteval: { datasets: true; results: true };
  }
}
