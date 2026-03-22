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

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Extract the authenticated user's profile ID from the request.
 * 
 * Flow:
 * 1. Get the Bearer token from the Authorization header
 * 2. Create a Supabase client with that token to leverage Clerk JWKS validation
 * 3. Extract the `sub` claim (Clerk user ID) from the validated JWT
 * 4. Look up the profile UUID from the `profiles` table via `clerk_id`
 * 
 * Falls back to `userId` from the request body if no Authorization header
 * is present (for backward compatibility during migration).
 */
export async function getUserIdFromRequest(
  req: Request,
  body: Record<string, any>,
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
  supabaseAnonKey: string,
): Promise<string | null> {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    
    // Skip if it's the anon key itself (not a user token)
    if (token === supabaseAnonKey) {
      // Fall through to body userId
    } else {
      try {
        // Create a client with the user's token to leverage Supabase's built-in JWT validation
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        const userClient = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { autoRefreshToken: false, persistSession: false },
        });
        
        // getUser() validates the JWT and returns the user info
        // With Clerk Third-Party Auth, this extracts the sub claim
        const { data: { user }, error } = await userClient.auth.getUser(token);
        
        if (user && !error) {
          // user.id is the Clerk user ID (sub claim)
          // Look up the profile UUID
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
        console.warn('[Auth] JWT validation failed, falling back to body userId:', e);
      }
    }
  }
  
  // Backward compatibility: accept userId from body
  // This should be removed once all clients send Authorization headers
  if (body?.userId) {
    return body.userId;
  }
  
  return null;
}

/**
 * Standard 401 response for unauthorized requests.
 */
export function unauthorizedResponse(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: 'Unauthorized — valid authentication required' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
