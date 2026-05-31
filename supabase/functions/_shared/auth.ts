/**
 * SHARED AUTH HELPER FOR EDGE FUNCTIONS
 *
 * Extracts and validates user identity from the Authorization header.
 * Uses Supabase's built-in Clerk JWKS validation (Third-Party Auth).
 *
 * Usage:
 *   const userId = await getUserId(req, supabaseServiceClient);
 *   if (!userId) return unauthorizedResponse(corsHeaders);
 */

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export function getRequestAuthTokens(headers: Headers): {
  bearerToken: string | null;
  clerkToken: string | null;
} {
  const bearerToken = extractBearerToken(
    headers.get('authorization') || headers.get('Authorization')
  );
  const clerkToken = headers.get('x-clerk-token')?.trim() || bearerToken;

  return {
    bearerToken,
    clerkToken: clerkToken || null,
  };
}

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);

  if (typeof atob === 'function') {
    return atob(base64 + padding);
  }

  return Buffer.from(base64 + padding, 'base64').toString('utf8');
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const payload = token.split('.')[1];
  if (!payload) return null;

  try {
    return JSON.parse(decodeBase64Url(payload)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function projectRefFromSupabaseUrl(supabaseUrl: string): string | null {
  try {
    const host = new URL(supabaseUrl).hostname;
    const [ref] = host.split('.');
    return ref || null;
  } catch {
    return null;
  }
}

export function isServiceRoleToken(
  bearerToken: string | null,
  supabaseServiceRoleKey: string,
  supabaseUrl: string
): boolean {
  if (!bearerToken) return false;
  if (bearerToken === supabaseServiceRoleKey) return true;

  // Supabase's edge gateway validates JWTs before the function runs. Accept
  // legacy service_role JWTs even when the runtime env uses a new `sb_secret`
  // key, but only for this exact project ref.
  const payload = decodeJwtPayload(bearerToken);
  const projectRef = projectRefFromSupabaseUrl(supabaseUrl);

  return (
    payload?.iss === 'supabase' &&
    payload?.role === 'service_role' &&
    typeof payload?.ref === 'string' &&
    payload.ref === projectRef
  );
}

/**
 * Normalize the result of the `requesting_user_id()` RPC into a profile UUID.
 *
 * supabase-js returns scalar RPCs as the value directly, but defensively
 * handle array/object row shapes too.
 */
export function parseRequestingUserId(data: unknown): string | null {
  if (typeof data === 'string') {
    const trimmed = data.trim();
    return trimmed ? trimmed : null;
  }

  if (Array.isArray(data)) {
    return data.length > 0 ? parseRequestingUserId(data[0]) : null;
  }

  if (data && typeof data === 'object') {
    const value = (data as Record<string, unknown>).requesting_user_id;
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  return null;
}

/**
 * Extract the authenticated user's profile ID from the request.
 *
 * Identity is resolved the SAME way the app's RLS-protected DB calls work:
 * the Clerk session token is validated by Supabase Third-Party Auth at the
 * PostgREST layer, and `requesting_user_id()` maps `auth.jwt()->>'sub'`
 * (the Clerk user id) to the profile UUID.
 *
 * GoTrue's `auth.getUser()` does NOT validate third-party Clerk JWTs, so it is
 * only kept as a secondary fallback for native Supabase auth tokens.
 *
 * Body-provided user ids are only accepted from service-role callers.
 */
export async function getUserIdFromRequest(
  req: Request,
  body: Record<string, any>,
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
  supabaseAnonKey: string
): Promise<string | null> {
  const { bearerToken, clerkToken } = getRequestAuthTokens(req.headers);
  const requestedUserId = body?.userId || body?.user_id || null;

  if (isServiceRoleToken(bearerToken, supabaseServiceRoleKey, supabaseUrl)) {
    return requestedUserId;
  }

  const tokenToValidate = clerkToken && clerkToken !== supabaseAnonKey ? clerkToken : null;
  if (!tokenToValidate) {
    return null;
  }

  try {
    // @ts-ignore Deno edge functions resolve remote URL imports at runtime.
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');

    // Use the `accessToken` option (Supabase third-party auth) so the Clerk
    // session token is sent as the Authorization bearer on every PostgREST
    // request. Setting it via `global.headers.Authorization` does NOT work:
    // supabase-js overrides Authorization with the anon key whenever there is
    // no GoTrue session, so `requesting_user_id()` would run as the anon role
    // and always return null (→ 401 for the caller).
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      accessToken: async () => tokenToValidate,
    });

    // Primary: resolve through the same third-party-auth path the app already
    // uses for DB calls. `requesting_user_id()` returns the profile UUID.
    const { data: rpcData, error: rpcError } = await userClient.rpc('requesting_user_id');
    if (!rpcError) {
      const resolved = parseRequestingUserId(rpcData);
      if (resolved) return resolved;
    } else {
      console.warn('[Auth] requesting_user_id RPC failed:', rpcError.message);
    }

    // Fallback: native Supabase auth tokens validated via GoTrue. A separate
    // client is required here because `.auth.*` methods are unavailable on a
    // client configured with the `accessToken` option.
    const gotrueClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const {
      data: { user },
      error,
    } = await gotrueClient.auth.getUser(tokenToValidate);

    if (user && !error) {
      const sb = createClient(supabaseUrl, supabaseServiceRoleKey);
      const { data: profile } = await sb
        .from('profiles')
        .select('id')
        .eq('clerk_id', user.id)
        .maybeSingle();

      if (profile?.id) {
        return profile.id;
      }
    }
  } catch (e) {
    console.warn('[Auth] JWT validation failed:', e);
  }

  return null;
}

/**
 * Standard 401 response for unauthorized requests.
 */
export function unauthorizedResponse(corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: 'Unauthorized — valid authentication required' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
