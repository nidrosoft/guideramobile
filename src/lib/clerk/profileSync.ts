import { supabase } from '@/lib/supabase/client';
import { Profile } from '@/types/auth.types';

const SYNC_MAX_ATTEMPTS = 3;
const SYNC_RETRY_DELAY_MS = 600;

function isNetworkError(error: unknown): boolean {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error);
  return (
    message.includes('Network request failed') ||
    message.includes('Failed to fetch') ||
    message.includes('Connection terminated') ||
    message.includes('fetch failed')
  );
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withNetworkRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= SYNC_MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isNetworkError(error) || attempt === SYNC_MAX_ATTEMPTS) {
        throw error;
      }
      if (__DEV__) {
        console.warn(`[ProfileSync] ${label} failed (attempt ${attempt}/${SYNC_MAX_ATTEMPTS}), retrying…`);
      }
      await sleep(SYNC_RETRY_DELAY_MS * attempt);
    }
  }
  throw lastError;
}

function isNoRowsError(error: { code?: string } | null): boolean {
  return error?.code === 'PGRST116';
}

// NOTE: We intentionally use the authenticated `supabase` client (not
// `supabaseNoAuth`) so every request carries the Clerk session token in the
// Authorization header. This lets RLS policies on `profiles` authorize the
// caller via `auth.jwt()->>'sub' = clerk_id`. Without this, INSERTs fail
// with Postgres 42501 (row-level security policy violation).
//
// The Clerk→Supabase bridge is installed in AuthContext's first useEffect
// before `syncClerkUserToSupabase` runs in the second useEffect, so the
// token is available on the first call.

/**
 * Generate a deterministic UUID from a Clerk user ID using MurmurHash3-based mixing.
 * Uses a Guidera-specific namespace prefix to prevent collisions with other systems.
 * The same Clerk ID always produces the same UUID — safe for DB primary keys.
 * 
 * Note: Existing users already have profiles matched by clerk_id column, not this UUID.
 * This UUID is only used when creating NEW profiles.
 */
function clerkIdToUuid(clerkId: string): string {
  const input = 'guidera:clerk:' + clerkId;
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  // Generate 4 x 32-bit values for full UUID coverage
  const v1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const v2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const v3 = ((h1 ^ 0x9e3779b9) >>> 0).toString(16).padStart(8, '0');
  const v4 = ((h2 ^ 0x517cc1b7) >>> 0).toString(16).padStart(8, '0');
  const hex = v1 + v2 + v3 + v4;

  // Format as UUID v4 (set version nibble to 4, variant bits to 10xx)
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${(8 + (parseInt(hex[16], 16) & 3)).toString(16)}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Syncs a Clerk user to the Supabase profiles table.
 * Called after every successful Clerk sign-in/sign-up.
 * 
 * Strategy:
 * - Uses clerk_id column to look up profiles (text, matches Clerk's user ID)
 * - profiles.id remains a UUID (auto-generated or deterministic from clerk ID)
 * - Preserves existing profile data (onboarding, preferences, etc.)
 */
export async function syncClerkUserToSupabase(clerkUser: {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: { emailAddress: string }[];
  phoneNumbers: { phoneNumber: string }[];
  imageUrl: string | null;
}): Promise<Profile | null> {
  const email = clerkUser.emailAddresses?.[0]?.emailAddress || '';
  const phone = clerkUser.phoneNumbers?.[0]?.phoneNumber || null;

  try {
    return await withNetworkRetry('syncClerkUserToSupabase', async () => {
      const { data, error } = await supabase.rpc('bootstrap_profile', {
        p_profile_id: clerkIdToUuid(clerkUser.id),
        p_clerk_id: clerkUser.id,
        p_first_name: clerkUser.firstName || '',
        p_last_name: clerkUser.lastName || '',
        p_email: email,
        p_phone: phone,
        p_avatar_url: clerkUser.imageUrl || null,
      });

      if (error) {
        if (isNetworkError(error)) {
          throw error;
        }
        console.error('[ProfileSync] Error bootstrapping profile:', error);
        return null;
      }

      return data as Profile | null;
    });
  } catch (error) {
    if (isNetworkError(error)) {
      if (__DEV__) console.warn('[ProfileSync] Supabase unreachable after retries — use cached profile if available');
    } else {
      console.error('[ProfileSync] Unexpected error:', error);
    }
    return null;
  }
}

/**
 * Get profile from Supabase by Clerk user ID
 */
export async function getProfileByClerkId(clerkUserId: string): Promise<Profile | null> {
  try {
    return await withNetworkRetry('getProfileByClerkId', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('clerk_id', clerkUserId)
        .maybeSingle();

      if (error && !isNoRowsError(error)) {
        if (isNetworkError(error)) {
          throw error;
        }
        console.error('[ProfileSync] Error fetching profile:', error);
        return null;
      }

      return (data as Profile) ?? null;
    });
  } catch (error) {
    if (__DEV__ && isNetworkError(error)) {
      console.warn('[ProfileSync] Could not fetch profile — Supabase unreachable');
    }
    return null;
  }
}

/**
 * Update profile in Supabase
 */
export async function updateSupabaseProfile(
  clerkUserId: string,
  updates: Partial<Profile>
): Promise<{ data: Profile | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('clerk_id', clerkUserId)
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as Profile, error: null };
}
