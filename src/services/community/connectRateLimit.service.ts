import { supabase } from '@/lib/supabase/client';

export type ConnectRateAction =
  | 'connect_discover_read'
  | 'connect_group_write'
  | 'connect_buddy_write'
  | 'connect_event_write'
  | 'connect_post_write'
  | 'connect_activity_write';

interface ConsumeConnectRateLimitOptions {
  userId?: string | null;
  actorKey?: string | null;
  action: ConnectRateAction;
  limit?: number;
  windowSeconds?: number;
}

interface ConnectRateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: string;
}

export class ConnectRateLimitError extends Error {
  readonly resetAt?: string;

  constructor(message: string, resetAt?: string) {
    super(message);
    this.name = 'ConnectRateLimitError';
    this.resetAt = resetAt;
  }
}

export async function consumeConnectRateLimit({
  userId,
  actorKey,
  action,
  limit,
  windowSeconds,
}: ConsumeConnectRateLimitOptions): Promise<ConnectRateLimitResult | null> {
  const { data, error } = await supabase.rpc('consume_connect_rate_limit', {
    p_user_id: userId || null,
    p_actor_key: actorKey || userId || 'anonymous',
    p_action: action,
    p_limit_count: limit ?? null,
    p_window_seconds: windowSeconds ?? null,
  });

  // If the API schema cache is briefly stale after migration, do not red-screen
  // Connect. The database-side bundled feed RPC still enforces read limits.
  if (error) {
    const message = String(error.message || '');
    if (error.code === 'PGRST202' || message.includes('schema cache')) {
      return null;
    }
    throw new Error(error.message);
  }

  const result = data as ConnectRateLimitResult;
  if (!result?.allowed) {
    throw new ConnectRateLimitError(
      'Too many Connect actions. Please wait a moment and try again.',
      result?.resetAt
    );
  }

  return result;
}

export function consumeConnectWriteRateLimit(
  userId: string,
  action: Exclude<ConnectRateAction, 'connect_discover_read'>
): Promise<ConnectRateLimitResult | null> {
  return consumeConnectRateLimit({ userId, action });
}
