import { normalizeEdgeScaleKey } from './rateLimit.ts';

export interface EdgeLockResult {
  acquired: boolean;
  ownerId: string;
}

interface RpcClient {
  rpc: (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message?: string } | null }>;
}

function parseLockResult(data: unknown, ownerId: string): EdgeLockResult {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== 'object') return { acquired: false, ownerId };
  const value = row as Record<string, unknown>;
  return {
    acquired: Boolean(value.acquired),
    ownerId:
      typeof value.owner_id === 'string'
        ? value.owner_id
        : typeof value.ownerId === 'string'
          ? value.ownerId
          : ownerId,
  };
}

export async function tryAcquireEdgeLock(
  supabase: RpcClient,
  namespace: string,
  lockKey: string,
  ttlSeconds = 30
): Promise<EdgeLockResult> {
  const ownerId = crypto.randomUUID();
  const { data, error } = await supabase.rpc('edge_try_acquire_lock', {
    p_namespace: normalizeEdgeScaleKey(namespace),
    p_lock_key: normalizeEdgeScaleKey(lockKey),
    p_owner_id: ownerId,
    p_ttl_seconds: Math.max(1, Math.floor(ttlSeconds)),
  });

  if (error) {
    console.warn(
      `[edgeScale] Failed to acquire lock ${namespace}:${lockKey}: ${error.message || 'unknown error'}`
    );
    return { acquired: false, ownerId };
  }

  return parseLockResult(data, ownerId);
}

export async function releaseEdgeLock(
  supabase: RpcClient,
  namespace: string,
  lockKey: string,
  ownerId: string,
  status: 'completed' | 'failed' = 'completed'
): Promise<void> {
  const { error } = await supabase.rpc('edge_release_lock', {
    p_namespace: normalizeEdgeScaleKey(namespace),
    p_lock_key: normalizeEdgeScaleKey(lockKey),
    p_owner_id: ownerId,
    p_status: status,
  });

  if (error) {
    console.warn(
      `[edgeScale] Failed to release lock ${namespace}:${lockKey}: ${error.message || 'unknown error'}`
    );
  }
}
