export { voltops } from '#/voltops/provider';
export type { VoltOpsProviderOptions } from '#/voltops/provider';

declare module '@viteval/core' {
  interface ProviderRegistry {
    voltops: { datasets: true; results: true };
  }
}
