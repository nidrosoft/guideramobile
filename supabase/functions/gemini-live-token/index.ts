/**
 * GEMINI LIVE TOKEN EDGE FUNCTION
 *
 * Generates short-lived ephemeral tokens for the Gemini Live API.
 * Uses the @google/genai SDK to create tokens (the only supported way).
 * The GOOGLE_AI_API_KEY stays server-side — clients receive a
 * single-use token valid for 2 minutes (new session) / 30 minutes (session).
 *
 * Rate limiting: durable per-user token buckets through edge_consume_rate_limit.
 */

import { GoogleGenAI } from 'npm:@google/genai@^1.0.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getUserIdFromRequest } from '../_shared/auth.ts';
import {
  consumePhase6RateLimit,
  deferPhase6Work,
  recordPhase6Metric,
} from '../_shared/phase6Edge.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-clerk-token',
  'Content-Type': 'application/json',
};

// ─── Constants ───────────────────────────────────────────────

const LIVE_MODEL = 'gemini-3.1-flash-live-preview';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const SUPABASE_ANON_KEY =
  Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_ANON_PUBLIC_KEY') || '';
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getServiceClient(): ReturnType<typeof createClient> | null {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  }
  return supabaseClient;
}

function liveTokenMetric(
  supabase: ReturnType<typeof createClient> | null,
  input: {
    statusCode: number;
    durationMs: number;
    cacheStatus?: 'hit' | 'miss' | 'rate_limited' | 'error' | 'skipped';
    errorMessage?: string | null;
  }
): void {
  if (!supabase) return;
  deferPhase6Work(
    recordPhase6Metric(supabase, {
      action: 'gemini_live_token',
      provider: 'gemini_live',
      ...input,
    })
  );
}

// ─── Main Handler ────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const startTime = Date.now();
  let metricClient: ReturnType<typeof createClient> | null = null;

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: CORS,
    });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GOOGLE_AI_API_KEY not configured' }), {
        status: 500,
        headers: CORS,
      });
    }

    const supabase = getServiceClient();
    metricClient = supabase;
    if (!supabase) {
      return new Response(JSON.stringify({ error: 'Rate limit service unavailable' }), {
        status: 503,
        headers: CORS,
      });
    }

    const body = await req.json().catch(() => ({}));
    const userId = await getUserIdFromRequest(
      req,
      body,
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_ANON_KEY
    );

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Valid authentication required' }), {
        status: 401,
        headers: CORS,
      });
    }

    const rateLimit = await consumePhase6RateLimit(supabase, {
      action: 'gemini_live_token',
      actorKey: userId,
    });
    if (!rateLimit.allowed) {
      liveTokenMetric(supabase, {
        statusCode: 429,
        durationMs: Date.now() - startTime,
        cacheStatus: 'rate_limited',
      });
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded.',
          resetAt: rateLimit.resetAt,
          retryAfterSeconds: 60,
        }),
        { status: 429, headers: CORS }
      );
    }

    // Create ephemeral token using the official SDK
    const client = new GoogleGenAI({ apiKey });

    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(Date.now() + 2 * 60 * 1000).toISOString();

    // NOTE: We intentionally do NOT set `liveConnectConstraints`. Empirically
    // (verified via a live self-test against this account/model), declaring tools
    // inside the token's constraints makes the BidiGenerateContentConstrained
    // session fail with "1011: Internal error encountered." The constrained
    // endpoint happily accepts client-supplied tools in the setup message when the
    // token is unconstrained, so tools are declared client-side in
    // geminiLive.service.ts instead.
    const token = await client.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        newSessionExpireTime,
        // httpOptions is part of CreateAuthTokenConfig per @google/genai SDK
        httpOptions: { apiVersion: 'v1alpha' },
      },
    });

    if (!token) {
      throw new Error('No token returned from Gemini API');
    }

    // The SDK returns AuthToken with:
    //   .name  = resource path (e.g. "authTokens/abc123") — NOT the bearer token
    //   .token = the actual JWT/bearer token to use for WebSocket auth
    const bearerToken = token.token || token.name;
    if (!bearerToken) {
      throw new Error('No usable token field found in response');
    }

    liveTokenMetric(supabase, {
      statusCode: 200,
      durationMs: Date.now() - startTime,
      cacheStatus: 'miss',
    });

    return new Response(
      JSON.stringify({
        token: bearerToken,
        expireTime: token.expireTime || expireTime,
        model: LIVE_MODEL,
      }),
      { headers: CORS }
    );
  } catch (e: any) {
    console.error('[gemini-live-token] Error:', e);
    liveTokenMetric(metricClient, {
      statusCode: 500,
      durationMs: Date.now() - startTime,
      cacheStatus: 'error',
      errorMessage: e?.message || 'Failed to create token',
    });
    return new Response(JSON.stringify({ error: e.message || 'Failed to create token' }), {
      status: 500,
      headers: CORS,
    });
  }
});
