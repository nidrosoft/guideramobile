/**
 * GEMINI LIVE TOKEN EDGE FUNCTION
 *
 * Generates short-lived ephemeral tokens for the Gemini Live API.
 * Uses the @google/genai SDK to create tokens (the only supported way).
 * The GOOGLE_AI_API_KEY stays server-side — clients receive a
 * single-use token valid for 2 minutes (new session) / 30 minutes (session).
 *
 * Rate limiting: max 10 tokens per user per hour, tracked in-memory.
 */

import { GoogleGenAI } from "npm:@google/genai@^1.0.0";

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// ─── In-Memory Rate Limiter ──────────────────────────────────
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 50; // max 50 tokens per hour per user

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  rateLimitMap.set(userId, recent);

  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  recent.push(now);
  rateLimitMap.set(userId, recent);
  return false;
}

// Periodically clean stale entries (every 10 min)
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of rateLimitMap.entries()) {
    const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (recent.length === 0) {
      rateLimitMap.delete(key);
    } else {
      rateLimitMap.set(key, recent);
    }
  }
}, 10 * 60 * 1000);

// ─── Constants ───────────────────────────────────────────────

const LIVE_MODEL = 'gemini-3.1-flash-live-preview';

// ─── Main Handler ────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: CORS },
    );
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GOOGLE_AI_API_KEY not configured' }),
        { status: 500, headers: CORS },
      );
    }

    const body = await req.json().catch(() => ({}));
    const { voiceName, userId } = body;

    // Rate limit by userId or fall back to IP
    const rateLimitKey = userId || req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'anonymous';

    if (isRateLimited(rateLimitKey)) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. Maximum 10 live sessions per hour.',
          retryAfterSeconds: 60,
        }),
        { status: 429, headers: CORS },
      );
    }

    // Create ephemeral token using the official SDK
    const client = new GoogleGenAI({ apiKey });

    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(Date.now() + 2 * 60 * 1000).toISOString();

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

    // Debug: log available fields on the token object
    console.log('[gemini-live-token] Token object keys:', Object.keys(token));
    console.log('[gemini-live-token] token.name:', token.name ? token.name.substring(0, 30) + '...' : 'undefined');
    console.log('[gemini-live-token] token.token:', token.token ? token.token.substring(0, 30) + '...' : 'undefined');

    // The SDK returns AuthToken with:
    //   .name  = resource path (e.g. "authTokens/abc123") — NOT the bearer token
    //   .token = the actual JWT/bearer token to use for WebSocket auth
    const bearerToken = token.token || token.name;
    if (!bearerToken) {
      throw new Error('No usable token field found in response');
    }

    return new Response(
      JSON.stringify({
        token: bearerToken,
        expireTime: token.expireTime || expireTime,
        model: LIVE_MODEL,
      }),
      { headers: CORS },
    );
  } catch (e: any) {
    console.error('[gemini-live-token] Error:', e);
    return new Response(
      JSON.stringify({ error: e.message || 'Failed to create token' }),
      { status: 500, headers: CORS },
    );
  }
});
