export { braintrust } from './braintrust/provider';
export type { BraintrustProviderOptions } from './braintrust/types';

declare module '@viteval/core' {
  interface ProviderRegistry {
    braintrust: { datasets: true; results: true };
  }
}
