export interface CronAuthSecrets {
  serviceRoleKey?: string | null;
  cronSecret?: string | null;
}

export function extractBearerToken(authorization: string | null): string | null {
  const match = authorization?.match(/^bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function hasUsableSecret(value?: string | null): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isAuthorizedCronRequest(headers: Headers, secrets: CronAuthSecrets): boolean {
  const serviceRoleKey = secrets.serviceRoleKey?.trim();
  const cronSecret = secrets.cronSecret?.trim();

  if (!hasUsableSecret(serviceRoleKey) && !hasUsableSecret(cronSecret)) {
    return false;
  }

  const bearer = extractBearerToken(headers.get('authorization'));
  if (hasUsableSecret(serviceRoleKey) && bearer === serviceRoleKey) {
    return true;
  }

  const providedCronSecret = headers.get('x-cron-secret')?.trim();
  return hasUsableSecret(cronSecret) && providedCronSecret === cronSecret;
}

export function requireCronOrServiceAuth(
  req: Request,
  corsHeaders: Record<string, string> = {}
): Response | null {
  const denoEnv = (globalThis as { Deno?: { env?: { get: (key: string) => string | undefined } } })
    .Deno?.env;
  const authorized = isAuthorizedCronRequest(req.headers, {
    serviceRoleKey: denoEnv?.get('SUPABASE_SERVICE_ROLE_KEY'),
    cronSecret: denoEnv?.get('CRON_SECRET'),
  });

  if (authorized) return null;

  void recordUnauthorizedCronAttempt(req);

  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function recordUnauthorizedCronAttempt(req: Request): Promise<void> {
  const denoEnv = (globalThis as { Deno?: { env?: { get: (key: string) => string | undefined } } })
    .Deno?.env;
  const supabaseUrl = denoEnv?.get('SUPABASE_URL');
  const serviceRoleKey = denoEnv?.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) return;

  try {
    const pathname = new URL(req.url).pathname;
    const requester =
      req.headers.get('x-guidera-client-id') ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('cf-connecting-ip') ||
      'unknown';

    await fetch(`${supabaseUrl}/rest/v1/edge_request_metrics`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        namespace: 'cron_auth',
        phase: pathname,
        cache_status: 'unauthorized',
        status_code: 401,
        duration_ms: 0,
        provider_summary: { requester },
        error_message: 'Unauthorized cron/admin request',
      }),
    });
  } catch {
    // Auth rejection should never fail open because metrics failed.
  }
}
