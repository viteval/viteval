# Provider Research

Research into third-party eval/observability platforms for viteval provider integration.

Only platforms with **TypeScript/JavaScript SDK support** are tracked here.

## Provider Interface

Our provider interface has two domains:

- **DatasetProvider** — `create`, `get`, `list`, `update`, `delete`, `getItems`, `addItems`
- **EvalProvider** — `create`, `get`, `list`, `addResult`, `complete`

See [`packages/core/src/provider/types.ts`](../../packages/core/src/provider/types.ts) for the full interface.

## Researched Providers

Fully researched with API mapping analysis.

| Provider                      | Datasets  | Evals | Priority | Status   |
| ----------------------------- | --------- | ----- | -------- | -------- |
| [Braintrust](./braintrust.md) | Yes       | Yes   | High     | Complete |
| [Langfuse](./langfuse.md)     | Yes       | Yes\* | High     | Complete |
| [LangSmith](./langsmith.md)   | Yes       | Yes   | High     | Complete |
| [Humanloop](./humanloop.md)   | Yes       | Yes\* | Medium   | Complete |
| [VoltAgent](./voltagent.md)   | Read-only | Yes   | Medium   | Complete |
| [Mastra](./mastra.md)         | Yes\*     | Yes\* | Low      | Complete |

\* = Significant architectural mismatch. See individual docs.

## Discovered Providers (Not Yet Researched)

Platforms with TypeScript SDKs that support datasets + eval runs. Need full API mapping.

| Provider    | npm Package        | Docs                                                                       | Notes                                    |
| ----------- | ------------------ | -------------------------------------------------------------------------- | ---------------------------------------- |
| Opik        | `opik`             | [Docs](https://www.comet.com/docs/opik/integrations/typescript-sdk)        | By Comet. Open-source, self-hostable.    |
| Literal AI  | (beta)             | [Docs](https://docs.literalai.com/guides/dataset)                          | Datasets + eval runs, GraphQL API.       |
| Patronus AI | `patronus-api`     | [Docs](https://docs.patronus.ai/docs/sdks-and-toolkits)                    | Enterprise, OTel support.                |
| Galileo AI  | (generated TS SDK) | [GitHub](https://github.com/rungalileo/galileo-ts-generated)               | 20+ prebuilt evaluators, sub-200ms eval. |
| Laminar     | `@lmnr-ai/lmnr`    | [Docs](https://docs.lmnr.ai/evaluations/using-dataset)                     | Open-source, YC S24, CLI eval runner.    |
| HoneyHive   | (TS SDK)           | [Docs](https://docs.honeyhive.ai/sdk-reference/typescript-experiments-ref) | Managed datasets, CI/CD integration.     |
| Promptfoo   | `promptfoo`        | [Docs](https://www.promptfoo.dev/docs/)                                    | CLI tool, MIT, acquired by OpenAI.       |
| PromptLayer | `promptlayer`      | [Docs](https://docs.promptlayer.com/languages/javascript)                  | Eval pipelines, 20+ column types.        |

## Common Patterns Across Providers

Patterns observed that inform our interface design:

1. **No provider has an explicit run status lifecycle.** Braintrust, Langfuse, and LangSmith all treat runs as implicitly complete when data stops flowing. Only VoltAgent and Humanloop have explicit `complete()` endpoints. Our `complete()` method is forward-thinking — providers without it just no-op.

2. **`addResult` is often multi-call.** Most platforms separate trace/run creation from score attachment. Our single `addResult()` call is a simplification that providers must stitch together.

3. **Cursor vs offset pagination.** Braintrust and LangSmith use cursor-based pagination. Our `offset`-based params are simpler but require cursor-walking adapters.

4. **Project/org scoping.** Braintrust requires `project_id`, LangSmith uses projects, Humanloop uses paths. Our interface has no project concept — providers handle this in their constructor config.

5. **Dataset versioning.** Langfuse, LangSmith, Humanloop, VoltAgent, and Mastra all version datasets. Our interface doesn't expose versioning — it's an implementation detail of each provider.

## Adding a New Provider

1. Copy `TEMPLATE.md` to `{provider-name}.md`
2. Research their API docs and TypeScript SDK
3. Fill in all mapping tables
4. Add to the table above
