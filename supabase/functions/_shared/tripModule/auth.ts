import { getUserIdFromRequest } from '../auth.ts';

interface TripAccessResult {
  allowed: boolean;
  userId: string | null;
  trip?: Record<string, any>;
  isServiceRoleCall: boolean;
}

interface SupabaseClientLike {
  from: (table: string) => any;
}

export async function verifyTripModuleAccess(
  req: Request,
  body: Record<string, any>,
  supabase: SupabaseClientLike,
  env: {
    supabaseUrl: string;
    serviceRoleKey: string;
    anonKey: string;
  }
): Promise<TripAccessResult> {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  const isServiceRoleCall =
    authHeader.startsWith('Bearer ') && authHeader.replace('Bearer ', '') === env.serviceRoleKey;
  const userId = await getUserIdFromRequest(
    req,
    body,
    env.supabaseUrl,
    env.serviceRoleKey,
    env.anonKey
  ).catch(() => null);
  const requestedUserId =
    typeof body.userId === 'string'
      ? body.userId
      : typeof body.user_id === 'string'
        ? body.user_id
        : null;

  if (!body.tripId) return { allowed: false, userId, isServiceRoleCall };

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', body.tripId)
    .maybeSingle();

  if (!trip) return { allowed: false, userId, isServiceRoleCall };
  if (isServiceRoleCall)
    return { allowed: true, userId: userId || trip.user_id, trip, isServiceRoleCall };

  // Mobile Edge Function calls use the public anon function gateway and pass
  // the Clerk-synced profile ID in the body. Only trust it after verifying the
  // trip row belongs to that profile.
  const effectiveUserId = userId || requestedUserId;
  const ownsTrip = Boolean(
    effectiveUserId && (trip.user_id === effectiveUserId || trip.owner_id === effectiveUserId)
  );
  if (ownsTrip) return { allowed: true, userId: effectiveUserId, trip, isServiceRoleCall };

  const { data: member } = await supabase
    .from('trip_members')
    .select('id')
    .eq('trip_id', body.tripId)
    .eq('user_id', effectiveUserId)
    .maybeSingle();

  return {
    allowed: Boolean(member?.id),
    userId: effectiveUserId,
    trip,
    isServiceRoleCall,
  };
}

export function tripModuleUnauthorizedResponse(corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ success: false, error: 'Valid trip access required' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
