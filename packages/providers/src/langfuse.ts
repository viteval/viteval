export { langfuse } from '#/langfuse/provider';
export type { LangfuseProviderOptions } from '#/langfuse/provider';

declare module '@viteval/core' {
  interface ProviderRegistry {
    langfuse: { datasets: true; results: true };
  }
}
