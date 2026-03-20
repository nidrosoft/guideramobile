import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Read from environment variables — secrets must never be hardcoded in source
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  if (__DEV__) console.warn('[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY env vars');
}

// ─── Clerk↔Supabase Native Third-Party Auth ─────────────────────────────────
// Supabase natively validates Clerk session tokens via JWKS (no shared secret).
// The `accessToken` callback provides the Clerk session token for every request.
// Supabase verifies it against Clerk's public keys, then `auth.jwt()->>'sub'`
// returns the Clerk user ID which `requesting_user_id()` maps to a profile UUID.
// ──────────────────────────────────────────────────────────────────────────────

let _clerkTokenGetter: (() => Promise<string | null>) | null = null;

/**
 * Register (or clear) the Clerk session token provider.
 * Called from AuthContext when sign-in state changes.
 */
export function setClerkTokenGetter(getter: (() => Promise<string | null>) | null) {
  _clerkTokenGetter = getter;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: async (input, init) => {
      const requestUrl = typeof input === 'string'
        ? input
        : input instanceof Request
          ? input.url
          : String(input);

      // Inject Clerk token for DB/Storage/Realtime — but NOT edge functions.
      // Edge functions use service_role key internally and their gateway
      // rejects third-party JWTs even with verify_jwt: false.
      if (!requestUrl.includes('/functions/v1/') && _clerkTokenGetter) {
        try {
          const token = await _clerkTokenGetter();
          if (token) {
            const headers = new Headers(init?.headers);
            headers.set('Authorization', `Bearer ${token}`);
            return fetch(input, { ...init, headers });
          }
        } catch (err) {
          if (__DEV__) console.warn('[Supabase] Failed to get Clerk token:', err);
        }
      }

      return fetch(input, init);
    },
  },
  auth: {
    autoRefreshToken: false,   // Clerk owns session refresh
    persistSession: false,     // Clerk owns session persistence
    detectSessionInUrl: false,
  },
});

/**
 * A non-bridged Supabase client that never injects the Clerk token.
 * Used by profileSync.ts for profile creation/lookup — these operations
 * run before the profile exists (so requesting_user_id() can't resolve yet)
 * and the profiles table has permissive RLS policies.
 */
export const supabaseNoAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// Export URL and public anon key for edge function calls via fetch().
// Note: The anon key is a PUBLIC client key protected by RLS — safe to be in the bundle.
export { supabaseUrl, supabaseAnonKey };
