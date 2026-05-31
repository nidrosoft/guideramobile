import {
  AI_INPUT_NAMESPACE,
  buildAiInputDedupeKey,
  buildAiInputRateLimitConfigs,
  beginAiInputGuard,
  estimateBase64DecodedBytes,
  validateBase64Payload,
} from '../../../supabase/functions/_shared/aiInputGuard';

describe('ai input guard helpers', () => {
  it('estimates decoded base64 payload size before decoding', () => {
    expect(estimateBase64DecodedBytes('QUJDRA==')).toBe(4);
    expect(estimateBase64DecodedBytes('data:image/jpeg;base64,QUJD')).toBe(3);
  });

  it('rejects payloads over the configured byte limit', () => {
    const result = validateBase64Payload('QUJDRA==', {
      fieldName: 'imageBase64',
      maxBytes: 3,
      allowedMimeTypes: ['image/jpeg'],
      mimeType: 'image/jpeg',
    });

    expect(result).toEqual({
      ok: false,
      status: 413,
      error: 'imageBase64 exceeds the 3 byte limit',
    });
  });

  it('rejects unsupported media types', () => {
    const result = validateBase64Payload('QUJD', {
      fieldName: 'audioBase64',
      maxBytes: 100,
      allowedMimeTypes: ['audio/m4a'],
      mimeType: 'video/mp4',
    });

    expect(result).toEqual({
      ok: false,
      status: 415,
      error: 'Unsupported media type: video/mp4',
    });
  });

  it('builds relaxed scan-ticket rate buckets for active testing', () => {
    expect(
      buildAiInputRateLimitConfigs({
        kind: 'scan_ticket',
        userId: 'profile-123',
        isPrivilegedTester: true,
      })
    ).toEqual([
      {
        namespace: AI_INPUT_NAMESPACE,
        bucketKey: 'scan_ticket:user:profile-123:hour',
        windowSeconds: 3600,
        maxRequests: 200,
      },
      {
        namespace: AI_INPUT_NAMESPACE,
        bucketKey: 'scan_ticket:user:profile-123:day',
        windowSeconds: 86400,
        maxRequests: 1000,
      },
    ]);
  });

  it('scopes dedupe cache keys by input kind user and hash', () => {
    expect(buildAiInputDedupeKey('scan_ticket', 'profile-123', 'abcdef')).toBe(
      'scan_ticket:user:profile-123:sha256:abcdef'
    );
  });

  it('returns an exact cached payload before consuming rate limits', async () => {
    const cachedResponse = { success: true, booking: { title: 'Cached booking' } };
    const chain: any = {
      select: jest.fn(() => chain),
      eq: jest.fn(() => chain),
      gt: jest.fn(() => chain),
      maybeSingle: jest.fn().mockResolvedValue({ data: { response: cachedResponse }, error: null }),
    };
    const supabase = {
      from: jest.fn(() => chain),
      rpc: jest.fn().mockResolvedValue({
        data: { allowed: false, reset_at: '2026-05-29T09:12:16.663Z' },
        error: null,
      }),
    };

    const guard = await beginAiInputGuard({
      req: new Request('https://example.test'),
      body: { imageBase64: 'QUJD' },
      supabase,
      resolveUserId: async () => 'profile-123',
      kind: 'scan_ticket',
      fieldName: 'imageBase64',
      maxBytes: 100,
      allowedMimeTypes: ['image/png'],
      mimeType: 'image/png',
      corsHeaders: {},
    });

    expect(supabase.rpc).not.toHaveBeenCalled();
    expect(guard.response?.status).toBe(200);
    await expect(guard.response?.json()).resolves.toMatchObject({
      success: true,
      cacheStatus: 'hit',
      cached: true,
      booking: { title: 'Cached booking' },
    });
  });
});
