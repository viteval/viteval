import { describe, expectTypeOf, it } from 'vitest';
import {
  type DatasetProviderName,
  type ResultProviderName,
  type RuntimeContext,
  defineConfig,
} from '@viteval/core';
import './langfuse';
import './braintrust';
import './s3';

describe('integration-owned provider types', () => {
  it('should contribute storage names and direct dataset handles', () => {
    expectTypeOf<'langfuse'>().toExtend<DatasetProviderName>();
    expectTypeOf<'braintrust'>().toExtend<ResultProviderName>();
    expectTypeOf<RuntimeContext['langfuse']>().toHaveProperty('dataset');
    defineConfig({
      dataset: { providers: ['s3'] },
      eval: { results: ['json', 'langfuse', 'braintrust'] },
    });
    // @ts-expect-error S3 supports dataset storage, not evaluation results.
    defineConfig({ eval: { results: ['s3'] } });
  });
});
