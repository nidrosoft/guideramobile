// @ts-ignore Deno Edge Functions require explicit .ts extensions for relative imports.
import { hasAccountEntitlement, INTERNAL_TESTING_ENTITLEMENT } from './accountEntitlements.ts';

export const AI_INPUT_NAMESPACE = 'ai_input';
const DEDUPE_CACHE_TTL_SECONDS = 24 * 60 * 60;

export type AiInputKind = 'scan_ticket' | 'scan_receipt' | 'transcribe_audio';

interface SupabaseLike {
  from: (table: string) => any;
  rpc: (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message?: string } | null }>;
}

interface ValidateBase64PayloadInput {
  fieldName: string;
  maxBytes: number;
  allowedMimeTypes: string[];
  mimeType?: string | null;
}

interface RateLimitInput {
  kind: AiInputKind;
  userId: string;
  isPrivilegedTester?: boolean;
}

interface BeginAiInputGuardInput<TCached = unknown> {
  req: Request;
  body: Record<string, any>;
  supabase: SupabaseLike;
  resolveUserId: () => Promise<string | null>;
  kind: AiInputKind;
  fieldName: string;
  maxBytes: number;
  allowedMimeTypes: string[];
  mimeType?: string | null;
  corsHeaders: Record<string, string>;
}

export interface AiInputGuardResult<TCached = unknown> {
  response?: Response;
  userId?: string;
  payloadHash?: string;
  cachedResponse?: TCached;
}

export function normalizeBase64Payload(value: string): string {
  return String(value || '').replace(/^data:[^,]+,/, '').replace(/\s+/g, '');
}

export function estimateBase64DecodedBytes(value: string): number {
  const normalized = normalizeBase64Payload(value);
  if (!normalized) return 0;
  const padding = normalized.endsWith('==') ? 2 : normalized.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((normalized.length * 3) / 4) - padding);
}

export function validateBase64Payload(value: string, input: ValidateBase64PayloadInput) {
  const normalized = normalizeBase64Payload(value);
  if (!normalized) {
    return { ok: false, status: 400, error: `${input.fieldName} is required` };
  }

  const mimeType = input.mimeType || '';
  if (input.allowedMimeTypes.length > 0 && !input.allowedMimeTypes.includes(mimeType)) {
    return { ok: false, status: 415, error: `Unsupported media type: ${mimeType || 'unknown'}` };
  }

  const decodedBytes = estimateBase64DecodedBytes(normalized);
  if (decodedBytes > input.maxBytes) {
    return {
      ok: false,
      status: 413,
      error: `${input.fieldName} exceeds the ${input.maxBytes} byte limit`,
    };
  }

  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) {
    return { ok: false, status: 400, error: `${input.fieldName} is not valid base64` };
  }

  return { ok: true, value: normalized, decodedBytes };
}

export function buildAiInputRateLimitConfigs(input: RateLimitInput) {
  if (input.kind === 'scan_ticket' && input.isPrivilegedTester) {
    return [
      {
        namespace: AI_INPUT_NAMESPACE,
        bucketKey: `${input.kind}:user:${input.userId}:hour`,
        windowSeconds: 3600,
        maxRequests: 200,
      },
      {
        namespace: AI_INPUT_NAMESPACE,
        bucketKey: `${input.kind}:user:${input.userId}:day`,
        windowSeconds: 86400,
        maxRequests: 1000,
      },
    ];
  }

  const hourlyLimit =
    input.kind === 'scan_ticket' ? 60 : input.kind === 'transcribe_audio' ? 30 : 20;
  const dailyLimit =
    input.kind === 'scan_ticket' ? 200 : input.kind === 'transcribe_audio' ? 120 : 80;
  return [
    {
      namespace: AI_INPUT_NAMESPACE,
      bucketKey: `${input.kind}:user:${input.userId}:hour`,
      windowSeconds: 3600,
      maxRequests: hourlyLimit,
    },
    {
      namespace: AI_INPUT_NAMESPACE,
      bucketKey: `${input.kind}:user:${input.userId}:day`,
      windowSeconds: 86400,
      maxRequests: dailyLimit,
    },
  ];
}

export function buildAiInputDedupeKey(kind: AiInputKind, userId: string, payloadHash: string): string {
  return `${kind}:user:${userId}:sha256:${payloadHash}`.slice(0, 500);
}

export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  corsHeaders: Record<string, string>
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function consumeAiInputRateLimits(supabase: SupabaseLike, input: RateLimitInput) {
  for (const config of buildAiInputRateLimitConfigs(input)) {
    const fallbackResetAt = new Date(Date.now() + config.windowSeconds * 1000).toISOString();
    const { data, error } = await supabase.rpc('edge_consume_rate_limit', {
      p_namespace: config.namespace,
      p_bucket_key: config.bucketKey,
      p_window_seconds: config.windowSeconds,
      p_max_requests: config.maxRequests,
    });

    if (error) {
      return { allowed: false, resetAt: fallbackResetAt, blockedKey: config.bucketKey };
    }

    const row = Array.isArray(data) ? data[0] : data;
    const value = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
    const allowed = Boolean(value.allowed);
    if (!allowed) {
      return {
        allowed: false,
        resetAt:
          typeof value.reset_at === 'string'
            ? value.reset_at
            : typeof value.resetAt === 'string'
              ? value.resetAt
              : fallbackResetAt,
        blockedKey:
          typeof value.blocked_key === 'string'
            ? value.blocked_key
            : typeof value.blockedKey === 'string'
              ? value.blockedKey
              : config.bucketKey,
      };
    }
  }

  return { allowed: true, resetAt: new Date().toISOString(), blockedKey: null };
}

export async function getAiInputDedupeCache<T>(
  supabase: SupabaseLike,
  kind: AiInputKind,
  userId: string,
  payloadHash: string
): Promise<T | null> {
  const cacheKey = buildAiInputDedupeKey(kind, userId, payloadHash);
  const { data, error } = await supabase
    .from('edge_response_cache')
    .select('response')
    .eq('namespace', AI_INPUT_NAMESPACE)
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !data?.response) return null;

  try {
    await supabase
      .from('edge_response_cache')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('namespace', AI_INPUT_NAMESPACE)
      .eq('cache_key', cacheKey);
  } catch {
    // Cache accounting should not block a valid hit.
  }

  return data.response as T;
}

export async function setAiInputDedupeCache<T>(
  supabase: SupabaseLike,
  kind: AiInputKind,
  userId: string,
  payloadHash: string,
  response: T
): Promise<void> {
  const expiresAt = new Date(Date.now() + DEDUPE_CACHE_TTL_SECONDS * 1000).toISOString();
  const { error } = await supabase.from('edge_response_cache').upsert(
    {
      namespace: AI_INPUT_NAMESPACE,
      cache_key: buildAiInputDedupeKey(kind, userId, payloadHash),
      response,
      provider_summary: { kind, userId, payloadHash },
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'namespace,cache_key' }
  );

  if (error) {
    console.warn(`[ai-input-guard] Failed to set dedupe cache: ${error.message || 'unknown'}`);
  }
}

export async function beginAiInputGuard<TCached = unknown>(
  input: BeginAiInputGuardInput<TCached>
): Promise<AiInputGuardResult<TCached>> {
  const userId = await input.resolveUserId();

  if (!userId) {
    return {
      response: jsonResponse({ success: false, error: 'Unauthorized' }, 401, input.corsHeaders),
    };
  }

  const validation = validateBase64Payload(String(input.body[input.fieldName] || ''), {
    fieldName: input.fieldName,
    maxBytes: input.maxBytes,
    allowedMimeTypes: input.allowedMimeTypes,
    mimeType: input.mimeType,
  });
  if (!validation.ok) {
    return {
      response: jsonResponse(
        { success: false, error: validation.error },
        validation.status || 400,
        input.corsHeaders
      ),
    };
  }

  const payloadHash = await sha256Hex(validation.value || '');
  const cachedResponse = await getAiInputDedupeCache<TCached>(
    input.supabase,
    input.kind,
    userId,
    payloadHash
  );
  if (cachedResponse) {
    return {
      response: jsonResponse(
        { ...(cachedResponse as Record<string, unknown>), cached: true, cacheStatus: 'hit' },
        200,
        input.corsHeaders
      ),
      userId,
      payloadHash,
      cachedResponse,
    };
  }

  const rateLimit = await consumeAiInputRateLimits(input.supabase, {
    kind: input.kind,
    userId,
    isPrivilegedTester: await hasAccountEntitlement(
      input.supabase,
      userId,
      INTERNAL_TESTING_ENTITLEMENT,
      'ai_input'
    ),
  });
  if (!rateLimit.allowed) {
    return {
      response: jsonResponse(
        {
          success: false,
          error: 'rate_limited',
          resetAt: rateLimit.resetAt,
          blockedKey: rateLimit.blockedKey,
        },
        429,
        input.corsHeaders
      ),
    };
  }

  input.body[input.fieldName] = validation.value;
  return { userId, payloadHash };
}
