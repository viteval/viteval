import { Readable } from 'node:stream';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { gcs } from './gcs';
import { s3 } from './s3';
import { langfuse } from './langfuse/provider';

afterEach(() => {
  vi.doUnmock('@aws-sdk/client-s3');
  vi.doUnmock('@google-cloud/storage');
  vi.restoreAllMocks();
});

describe('SDK transport validation', () => {
  it('should report exporter failures even when the SDK omits its error object', async () => {
    vi.spyOn(OTLPTraceExporter.prototype, 'export').mockImplementation(
      (_spans, callback) => callback({ code: 1 })
    );
    const provider = langfuse({ publicKey: 'fixture', secretKey: 'fixture' });
    try {
      expect(await provider.initialize()).toMatchObject({ ok: true });
      const run = await provider.evals!.create({
        name: 'rejected',
        config: { aggregation: 'mean', threshold: 1, scorerNames: [] },
      });
      if (!run.ok) throw run.error;
      expect(
        await provider.evals!.addResult({
          evalRunId: run.value.id,
          input: 'q',
          expected: 'a',
          output: 'a',
          scores: [],
          meanScore: 1,
          medianScore: 1,
          sumScore: 1,
          passed: true,
        })
      ).toMatchObject({
        ok: false,
        error: { message: 'Langfuse rejected OpenTelemetry export' },
      });
    } finally {
      await provider.close();
    }
  });
  it('should reject S3 SDK responses without bodies', async () => {
    const send = vi.fn().mockResolvedValue({});
    vi.doMock('@aws-sdk/client-s3', async () => ({
      ...(await vi.importActual('@aws-sdk/client-s3')),
      S3Client: vi.fn(function () {
        return { send, destroy: vi.fn() };
      }),
    }));
    const provider = s3({ bucket: 'bucket' });
    try {
      expect(await provider.initialize()).toMatchObject({ ok: true });
      expect(await provider.datasets!.list()).toMatchObject({
        ok: false,
        error: {
          message: 'S3 object is missing a body: viteval/datasets/index.json',
        },
      });
    } finally {
      await provider.close();
    }
  });
  it.each([
    {
      response: null,
      chunk: Buffer.from('{}'),
      message: 'missing a usable generation',
    },
    {
      response: { headers: null },
      chunk: Buffer.from('{}'),
      message: 'missing a usable generation',
    },
    {
      response: { headers: {} },
      chunk: Buffer.from('{}'),
      message: 'missing a usable generation',
    },
    {
      response: { headers: { 'x-goog-generation': 123 } },
      chunk: Buffer.from('{}'),
      message: 'missing a usable generation',
    },
    {
      response: { headers: { 'x-goog-generation': '123' } },
      chunk: 'invalid SDK chunk',
      message: 'Invalid GCS download body',
    },
  ])(
    'should reject malformed GCS stream events $response',
    async ({ response, chunk, message }) => {
      vi.doMock('@google-cloud/storage', () => ({
        Storage: vi.fn(function () {
          return {
            bucket: () => ({
              file: () => ({
                createReadStream: () => {
                  const stream = Readable.from(
                    (async function* () {
                      stream.emit('response', response);
                      yield chunk;
                    })()
                  );
                  return stream;
                },
              }),
            }),
          };
        }),
      }));
      const provider = gcs({ bucket: 'bucket' });
      try {
        expect(await provider.initialize()).toMatchObject({ ok: true });
        expect(await provider.datasets!.list()).toMatchObject({
          ok: false,
          error: { message: expect.stringContaining(message) },
        });
      } finally {
        await provider.close();
      }
    }
  );
});
