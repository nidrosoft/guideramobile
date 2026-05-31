const mockRpc = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    rpc: (...args: any[]) => mockRpc(...args),
  },
}));

import {
  ConnectRateLimitError,
  consumeConnectRateLimit,
  consumeConnectWriteRateLimit,
} from '@/services/community/connectRateLimit.service';

describe('connectRateLimit.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRpc.mockResolvedValue({
      data: {
        allowed: true,
        limit: 20,
        remaining: 19,
        resetAt: '2026-05-29T04:00:00Z',
      },
      error: null,
    });
  });

  it('consumes a durable Connect rate bucket through RPC', async () => {
    await consumeConnectWriteRateLimit('user-1', 'connect_group_write');

    expect(mockRpc).toHaveBeenCalledWith('consume_connect_rate_limit', {
      p_user_id: 'user-1',
      p_actor_key: 'user-1',
      p_action: 'connect_group_write',
      p_limit_count: null,
      p_window_seconds: null,
    });
  });

  it('throws a typed error when the bucket is exhausted', async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        allowed: false,
        limit: 20,
        remaining: 0,
        resetAt: '2026-05-29T04:00:00Z',
      },
      error: null,
    });

    await expect(
      consumeConnectRateLimit({ userId: 'user-1', action: 'connect_post_write' })
    ).rejects.toBeInstanceOf(ConnectRateLimitError);
  });

  it('fails open during a short Supabase schema-cache miss', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: {
        code: 'PGRST202',
        message: 'Could not find the function public.consume_connect_rate_limit in the schema cache',
      },
    });

    await expect(
      consumeConnectWriteRateLimit('user-1', 'connect_buddy_write')
    ).resolves.toBeNull();
  });
});
