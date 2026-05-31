import {
  assertPhase6PayloadSize,
  buildPhase6CacheKey,
  consumePhase6RateLimit,
  getPhase6ActionPolicy,
  recordPhase6Metric,
} from '../../../supabase/functions/_shared/phase6Edge';

function createRpcClient(result: unknown, error: { message: string } | null = null) {
  return {
    rpc: jest.fn().mockResolvedValue({ data: result, error }),
  };
}

function createTableClient(error: { message: string } | null = null) {
  const insert = jest.fn().mockResolvedValue({ error });
  return {
    from: jest.fn(() => ({ insert })),
    insert,
  };
}

describe('phase6Edge helpers', () => {
  it('defines conservative action policies for Google and AI utilities', () => {
    expect(getPhase6ActionPolicy('places_autocomplete')).toMatchObject({
      namespace: 'phase6_google',
      windowSeconds: 60,
      maxRequests: 60,
      cacheTtlSeconds: 600,
      maxTextChars: 120,
    });

    expect(getPhase6ActionPolicy('ai_vision')).toMatchObject({
      namespace: 'phase6_ai',
      windowSeconds: 60,
      maxRequests: 20,
      maxBase64Bytes: 4 * 1024 * 1024,
    });

    expect(getPhase6ActionPolicy('tts_generate')).toMatchObject({
      namespace: 'phase6_ai',
      windowSeconds: 60,
      maxRequests: 30,
      cacheTtlSeconds: 24 * 60 * 60,
      maxTextChars: 2000,
    });
  });

  it('builds stable normalized cache keys from action and params', () => {
    expect(
      buildPhase6CacheKey('places_details', {
        placeId: ' ChIJ 123 ',
        language: 'EN',
        ignored: undefined,
      })
    ).toBe('places_details:language=en:placeid=chij 123');
  });

  it('rejects oversized text and base64 payloads before provider calls', () => {
    expect(() =>
      assertPhase6PayloadSize('translation_translate', {
        text: 'x'.repeat(6001),
      })
    ).toThrow('text exceeds');

    expect(() =>
      assertPhase6PayloadSize('ai_vision', {
        image: 'a'.repeat(6 * 1024 * 1024),
      })
    ).toThrow('image exceeds');
  });

  it('consumes durable rate buckets with action-specific policy', async () => {
    const client = createRpcClient({
      allowed: true,
      remaining: 9,
      reset_at: '2026-05-29T00:00:00Z',
    });

    const result = await consumePhase6RateLimit(client as any, {
      action: 'places_autocomplete',
      actorKey: 'USER 123',
    });

    expect(result.allowed).toBe(true);
    expect(client.rpc).toHaveBeenCalledWith('edge_consume_rate_limit', {
      p_namespace: 'phase6_google',
      p_bucket_key: 'places_autocomplete:user 123',
      p_window_seconds: 60,
      p_max_requests: 60,
    });
  });

  it('records provider metrics with normalized action namespaces', async () => {
    const client = createTableClient();

    await recordPhase6Metric(client as any, {
      action: 'places_search',
      provider: 'google_places',
      statusCode: 200,
      durationMs: 42,
      cacheStatus: 'miss',
    });

    expect(client.from).toHaveBeenCalledWith('edge_request_metrics');
    expect(client.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        namespace: 'phase6_google:places_search',
        phase: 'google_places',
        cache_status: 'miss',
        status_code: 200,
        duration_ms: 42,
      })
    );
  });
});
