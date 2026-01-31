---
name: add-provider
description: >-
  This skill should be used when the user wants to "add provider", "integrate LLM",
  "add Anthropic", "add Azure OpenAI", "new provider", or "configure model backend".
  Creates a new LLM provider integration with config types, initialization, and tests.
---

# Add Provider

Create a new LLM provider integration following the viteval patterns.

## Usage

`/add-provider <name> [options]`

## Options

| Option | Description |
|--------|-------------|
| `<name>` | Name of the provider (lowercase, e.g., `anthropic`, `azure`) |
| `--description` | Description for JSDoc |

## Instructions

1. **Gather information:**
   - Provider name (required, lowercase)
   - Required configuration (API key, endpoint, etc.)
   - SDK/package to use for the provider

2. **Read existing patterns:**
   - Reference `packages/core/src/provider/initialize.ts` for initialization pattern
   - Check `packages/core/src/config/types.ts` for config types

3. **Update config types:**
   - Add provider config to `VitevalProviderConfig` in `packages/core/src/config/types.ts`

4. **Update initialize function:**
   - Add provider initialization logic to `packages/core/src/provider/initialize.ts`

5. **Generate test updates:**
   - Add tests for new provider in `packages/core/src/provider/initialize.test.ts`

6. **Run validation:**
   - Execute `pnpm --filter @viteval/core types` to verify types
   - Execute `pnpm --filter @viteval/core test` to run tests

## Template

### Config Types Update (`packages/core/src/config/types.ts`)

```typescript
export interface VitevalProviderConfig {
  openai?: OpenAIProviderConfig;
  <name>?: <Name>ProviderConfig;  // Add this
}

/**
 * Configuration for <Name> provider
 */
export interface <Name>ProviderConfig {
  /**
   * API key for <Name>
   */
  apiKey?: string;
  /**
   * Custom <Name> client instance
   */
  client?: <ClientType>;
  // Add other provider-specific options
}
```

### Initialize Update (`packages/core/src/provider/initialize.ts`)

```typescript
import { <Name>Client } from '<sdk-package>';

export function initializeProvider(config?: VitevalProviderConfig) {
  if (globalThis.__client) {
    return;
  }

  const providerConfig = config ?? getProviderConfigFromEnv();

  if (!providerConfig) {
    throw new Error('No provider config found');
  }

  // Add <name> provider handling
  if (providerConfig.<name>) {
    const client = match(providerConfig.<name>)
      .returnType<<ClientType> | null>()
      .with({ client: P.not(P.nullish) }, ({ client }) => client)
      .with(
        { apiKey: P.not(P.nullish) },
        ({ apiKey }) => new <Name>Client({ apiKey })
      )
      .otherwise(() => null);

    if (client) {
      globalThis.__client = client;
      return;
    }
  }

  // Existing openai handling...
}

function getProviderConfigFromEnv(): VitevalProviderConfig | null {
  // Add env var support for new provider
  const <name>ApiKey = process.env.<NAME>_API_KEY;
  if (<name>ApiKey) {
    return {
      <name>: { apiKey: <name>ApiKey },
    };
  }

  // Existing env handling...
}
```

### Test Updates (`packages/core/src/provider/initialize.test.ts`)

```typescript
describe('initializeProvider', () => {
  // Existing tests...

  describe('<name> provider', () => {
    it('should initialize from config', () => {
      initializeProvider({
        <name>: { apiKey: 'test-key' },
      });
      expect(globalThis.__client).toBeDefined();
    });

    it('should initialize from env', () => {
      process.env.<NAME>_API_KEY = 'env-key';
      initializeProvider();
      expect(globalThis.__client).toBeDefined();
    });

    it('should accept custom client', () => {
      const customClient = new <Name>Client({ apiKey: 'test' });
      initializeProvider({
        <name>: { client: customClient },
      });
      expect(globalThis.__client).toBe(customClient);
    });
  });
});
```

## Environment Variables

| Provider | Environment Variable |
|----------|---------------------|
| OpenAI | `OPENAI_API_KEY` |
| Anthropic | `ANTHROPIC_API_KEY` |
| Azure | `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT` |

## Examples

**Add Anthropic provider:**
```
/add-provider anthropic --description "Anthropic Claude API integration"
```

**Add Azure OpenAI provider:**
```
/add-provider azure --description "Azure OpenAI Service integration"
```

## Checklist

- [ ] Config types updated with new provider
- [ ] Initialize function handles new provider
- [ ] Environment variable support added
- [ ] Tests added for new provider
- [ ] Types pass (`pnpm --filter @viteval/core types`)
- [ ] Tests pass (`pnpm --filter @viteval/core test`)
