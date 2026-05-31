import { invokeEdgeFn, isRetryableEdgeFunctionError } from '../../../src/utils/retry';

describe('isRetryableEdgeFunctionError', () => {
  it('does not retry rate-limited requests', () => {
    expect(isRetryableEdgeFunctionError(new Error('provider-manager failed: 429'))).toBe(false);
    expect(isRetryableEdgeFunctionError(new Error('Rate limit exceeded'))).toBe(false);
  });

  it('retries transient server and network failures', () => {
    expect(isRetryableEdgeFunctionError(new Error('503 service unavailable'))).toBe(true);
    expect(isRetryableEdgeFunctionError(new Error('failed to fetch'))).toBe(true);
  });

  it('does not retry function 401 responses even when the message is generic', () => {
    const error = {
      message: 'Edge Function returned a non-2xx status code',
      context: { status: 401 },
    };

    expect(isRetryableEdgeFunctionError(error)).toBe(false);
  });
});

describe('invokeEdgeFn', () => {
  it('forwards custom headers to Supabase function invocations', async () => {
    const invoke = jest.fn().mockResolvedValue({ data: { success: true }, error: null });
    const fakeSupabase = { functions: { invoke } };

    await invokeEdgeFn(fakeSupabase, 'scan-ticket', { imageBase64: 'abc' }, 'fast', {
      headers: { 'x-clerk-token': 'clerk-token' },
    });

    expect(invoke).toHaveBeenCalledWith('scan-ticket', {
      body: { imageBase64: 'abc' },
      headers: { 'x-clerk-token': 'clerk-token' },
    });
  });

  it('supports no-retry invocations for expensive OCR calls', async () => {
    const invoke = jest.fn().mockResolvedValue({
      data: null,
      error: { message: '503 service unavailable', context: { status: 503 } },
    });
    const fakeSupabase = { functions: { invoke } };

    const result = await invokeEdgeFn(fakeSupabase, 'scan-ticket', { imageBase64: 'abc' }, 'none');

    expect(result.error?.message).toContain('503');
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('preserves structured edge error bodies from non-2xx responses', async () => {
    const invoke = jest.fn().mockResolvedValue({
      data: null,
      error: {
        message: 'Edge Function returned a non-2xx status code',
        context: {
          status: 429,
          json: jest.fn().mockResolvedValue({
            error: 'rate_limited',
            resetAt: '2026-05-29T09:12:16.663Z',
          }),
        },
      },
    });
    const fakeSupabase = { functions: { invoke } };

    const result = await invokeEdgeFn(fakeSupabase, 'scan-ticket', { imageBase64: 'abc' }, 'none');

    expect(result.error?.message).toContain('429');
    expect(result.error?.message).toContain('rate_limited');
    expect((result.error as any).body).toMatchObject({
      error: 'rate_limited',
      resetAt: '2026-05-29T09:12:16.663Z',
    });
  });
});
