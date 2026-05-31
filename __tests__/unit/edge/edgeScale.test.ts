import {
  buildEdgeBucketKey,
  consumeEdgeRateLimit,
  normalizeEdgeScaleKey,
} from '../../../supabase/functions/_shared/edgeScale/rateLimit';
import {
  isCircuitOpen,
  nextCircuitState,
  shouldSkipProvider,
} from '../../../supabase/functions/_shared/providers/circuitBreaker';
import { checkRateLimit } from '../../../supabase/functions/_shared/rateLimiter';

function createRpcClient(result: unknown, error: { message: string } | null = null) {
  return {
    rpc: jest.fn().mockResolvedValue({ data: result, error }),
  };
}

describe('edgeScale rate limiting', () => {
  it('normalizes namespace and bucket keys consistently', () => {
    expect(normalizeEdgeScaleKey('  Events: Douala   Cameroon  ')).toBe('events:douala cameroon');
    expect(buildEdgeBucketKey(' Events ', ' USER:ABC ')).toBe('events:user:abc');
  });

  it('consumes durable rate limit buckets through the generic RPC', async () => {
    const client = createRpcClient({
      allowed: true,
      remaining: 4,
      reset_at: '2026-05-28T00:00:00Z',
    });

    const result = await consumeEdgeRateLimit(client as any, {
      namespace: 'events',
      bucketKey: 'user:abc',
      windowSeconds: 60,
      maxRequests: 5,
    });

    expect(result).toEqual({
      allowed: true,
      remaining: 4,
      resetAt: '2026-05-28T00:00:00Z',
      blockedKey: null,
    });
    expect(client.rpc).toHaveBeenCalledWith('edge_consume_rate_limit', {
      p_namespace: 'events',
      p_bucket_key: 'user:abc',
      p_window_seconds: 60,
      p_max_requests: 5,
    });
  });

  it('fails closed when durable rate limit storage errors', async () => {
    const client = createRpcClient(null, { message: 'database unavailable' });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      consumeEdgeRateLimit(client as any, {
        namespace: 'events',
        bucketKey: 'user:abc',
        windowSeconds: 60,
        maxRequests: 5,
      })
    ).resolves.toMatchObject({
      allowed: false,
      remaining: 0,
      blockedKey: 'events:user:abc',
    });

    errorSpy.mockRestore();
  });

  it('keeps legacy checkRateLimit API backed by edge buckets', async () => {
    const client = createRpcClient({
      allowed: true,
      remaining: 9,
      reset_at: '2026-05-28T00:00:00Z',
    });

    const result = await checkRateLimit(client as any, 'profile-123', {
      identifier: 'smart-plan',
      maxRequests: 10,
      windowMinutes: 60,
    });

    expect(result.allowed).toBe(true);
    expect(client.rpc).toHaveBeenCalledWith('edge_consume_rate_limit', {
      p_namespace: 'smart-plan',
      p_bucket_key: 'user:profile-123',
      p_window_seconds: 3600,
      p_max_requests: 10,
    });
  });
});

describe('provider circuit breaker', () => {
  it('opens after repeated failures and skips until cooldown expires', () => {
    const openedAt = new Date('2026-05-28T00:00:00Z').toISOString();
    expect(
      isCircuitOpen({
        consecutiveFailures: 5,
        lastFailedAt: openedAt,
        now: new Date('2026-05-28T00:00:30Z'),
        failureThreshold: 5,
        openDurationMs: 60_000,
      })
    ).toBe(true);

    expect(
      shouldSkipProvider(
        {
          providerCode: 'serpapi',
          consecutive_failures: 5,
          last_failed_call: openedAt,
          enabled: true,
          health_score: 90,
        },
        new Date('2026-05-28T00:00:30Z')
      )
    ).toBe(true);
  });

  it('allows half-open provider after cooldown and resets failures on success', () => {
    const openedAt = new Date('2026-05-28T00:00:00Z').toISOString();
    expect(
      isCircuitOpen({
        consecutiveFailures: 5,
        lastFailedAt: openedAt,
        now: new Date('2026-05-28T00:02:00Z'),
        failureThreshold: 5,
        openDurationMs: 60_000,
      })
    ).toBe(false);

    expect(
      nextCircuitState({
        previousFailures: 5,
        success: true,
        responseTimeMs: 450,
        now: new Date('2026-05-28T00:02:00Z'),
      })
    ).toMatchObject({
      consecutive_failures: 0,
      health_score: 100,
    });
  });

  it('increments failures and lowers health score on failure', () => {
    expect(
      nextCircuitState({
        previousFailures: 2,
        previousHealthScore: 80,
        success: false,
        statusCode: 503,
        now: new Date('2026-05-28T00:02:00Z'),
      })
    ).toMatchObject({
      consecutive_failures: 3,
      health_score: 55,
    });
  });
});
