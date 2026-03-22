/**
 * SHARED CORS HEADERS
 * 
 * Used across all Edge Functions.
 * 
 * For a mobile-only app, CORS headers are unnecessary (native HTTP clients
 * don't send Origin headers). We restrict to our own domains only.
 * If you add a web client, add its domain to ALLOWED_ORIGINS.
 */

const ALLOWED_ORIGINS = [
  'https://guidera.app',
  'https://www.guidera.app',
  'https://guidera.one',
];

export function getCorsHeaders(request?: Request): Record<string, string> {
  const origin = request?.headers?.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : '';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };
}

// Backward-compatible export for existing edge functions that import corsHeaders
// These will still work but with an empty origin (mobile requests don't need CORS)
export const corsHeaders = {
  'Access-Control-Allow-Origin': '',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}
